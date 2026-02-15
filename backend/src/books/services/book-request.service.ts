import {
  Injectable,
  NotFoundException,
  ConflictException,
  Inject,
  forwardRef,
  Logger,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource, In, Not } from 'typeorm';
import {
  BookRequest,
  BookRequestStatus,
  BookRequestType,
} from '../entities/book-request.entity';
import { User } from '../../users/entities/user.entity';
import { Book } from '../entities/book.entity';
import { BookCopy, BookCopyStatus } from '../entities/book-copy.entity';
import { QueueEntry, QueueStatus } from '../entities/queue-entry.entity';
import { BookLoan, LoanStatus } from '../entities/book-loan.entity';
import { BookLoanService } from './book-loan.service';
import { QueueService } from './queue.service';
import { BookNotAvailableException } from '../exceptions/book-not-available.exception';
import {
  MembershipService,
  MembershipStatus,
} from 'src/membership/membership.service';
import { EmailUtilsService } from 'src/emails/email-utils.service';

@Injectable()
export class BookRequestService {
  private readonly logger = new Logger(BookRequestService.name);

  constructor(
    @InjectRepository(BookRequest)
    private readonly bookRequestRepository: Repository<BookRequest>,
    @InjectRepository(QueueEntry)
    private readonly queueEntryRepository: Repository<QueueEntry>,
    @InjectRepository(BookCopy)
    private readonly bookCopyRepository: Repository<BookCopy>,
    @Inject(forwardRef(() => BookLoanService))
    private readonly bookLoanService: BookLoanService,
    @Inject(forwardRef(() => QueueService))
    private readonly queueService: QueueService,
    private readonly dataSource: DataSource,
    private readonly membershipService: MembershipService,
    private readonly emailUtilsService: EmailUtilsService,
    @InjectRepository(BookLoan)
    private readonly bookLoanRepository: Repository<BookLoan>,
  ) {}

  async createRequest(
    bookId: string,
    userId: string,
    reason?: string,
  ): Promise<BookRequest> {
    return this.dataSource.transaction(async (transactionalEntityManager) => {
      // 1️⃣ Check membership status
      const membership =
        await this.membershipService.findActiveMembership(userId);
      if (!membership) {
        throw new BadRequestException(
          'Active membership is required to request books',
        );
      }

      if (membership.status !== MembershipStatus.ACTIVE) {
        throw new BadRequestException(
          `Membership is ${membership.status.toLowerCase()}`,
        );
      }

      // 2️⃣ Get book with available copies
      const book = await transactionalEntityManager.findOne(Book, {
        where: { id: Number(bookId) },
        relations: ['copies'],
      });

      if (!book) {
        throw new NotFoundException('Book not found');
      }

      // 3️⃣ Check if user already has pending request or active loan
      const [existingRequest, existingLoan] = await Promise.all([
        transactionalEntityManager.findOne(BookRequest, {
          where: {
            book: { id: book.id },
            user: { id: userId },
            status: In([
              BookRequestStatus.PENDING,
              BookRequestStatus.QUEUED,
              BookRequestStatus.FULFILLED,
            ]),
          },
        }),
        transactionalEntityManager.findOne(BookLoan, {
          where: {
            user: { id: userId },
            bookCopy: { book: { id: book.id } },
            status: In([LoanStatus.ACTIVE, LoanStatus.OVERDUE]),
          },
          relations: ['bookCopy', 'bookCopy.book'],
        }),
      ]);

      if (existingRequest) {
        throw new ConflictException(
          'You already have a request or queue entry for this book',
        );
      }

      if (existingLoan) {
        throw new ConflictException(
          'You already have an active loan for this book',
        );
      }

      // 4️⃣ Decide: Request or Queue
      let status: BookRequestStatus;
      let queueEntryId: string | null = null;

      if (
        book.copies.filter((copy) => copy.status === BookCopyStatus.AVAILABLE)
          .length > 0
      ) {
        // There are available copies → normal request
        status = BookRequestStatus.PENDING;
      } else {
        // No copies → automatically join the queue
        status = BookRequestStatus.QUEUED;

        // Create queue entry (outside the transaction manager to reuse your QueueService)
        const queueEntry = await this.queueService.addToQueue(
          bookId,
          userId,
          transactionalEntityManager,
        );
        queueEntryId = queueEntry.id;
      }

      // 5️⃣ Create the book request
      const request = transactionalEntityManager.create(BookRequest, {
        book: { id: book.id },
        user: { id: userId },
        reason,
        status,
        queueId: queueEntryId,
      });

      const savedRequest = await transactionalEntityManager.save(
        BookRequest,
        request,
      );

      // 6️⃣ Return response with context info
      return {
        ...savedRequest,
        message:
          status === BookRequestStatus.PENDING
            ? 'Your book request has been submitted and is awaiting approval.'
            : 'All copies are currently borrowed. You’ve been added to the waiting list.',
      } as any;
    });
  }

  async approveRequest(
    requestId: string,
    approvedById: string,
    preferredCopyId?: string,
  ): Promise<{ loan?: BookLoan; queueEntry?: QueueEntry }> {
    return this.dataSource.transaction(async (transactionalEntityManager) => {
      const request = await transactionalEntityManager.findOne(BookRequest, {
        where: { id: requestId },
        relations: ['user', 'book', 'queueEntry'],
      });

      if (!request) {
        throw new NotFoundException('Request not found');
      }

      if (request.status !== BookRequestStatus.PENDING) {
        throw new ConflictException('Request is not in a pending state');
      }

      // Update request status
      request.status = BookRequestStatus.APPROVED;
      request.approvedAt = new Date();
      request.approvedBy = { id: approvedById } as User;
      request.approvedById = approvedById;

      try {
        // Try to create a loan with the preferred copy if specified
        const loan = await this.bookLoanService.createLoan(
          transactionalEntityManager,
          {
            preferredCopyId,
            bookId: request.book.id.toString(),
            userId: request.user.id,
            requestId: request.id,
            approvedById,
          },
        );

        // If we get here, the loan was created successfully
        request.status = BookRequestStatus.FULFILLED;
        request.fulfilledAt = new Date();
        // Update the request with the loan information
        await transactionalEntityManager.update(BookRequest, request.id, {
          status: BookRequestStatus.FULFILLED,
          fulfilledAt: new Date(),
          approvedById,
          loanId: loan.id,
        });

        // If there was a queue entry, remove it
        if (request.queueEntry) {
          request.queueEntry.status = QueueStatus.FULFILLED;
          request.queueEntry.fulfilledAt = new Date();
          await transactionalEntityManager.save(QueueEntry, request.queueEntry);
          request.queueEntry = null;
        }

        return { loan };
      } catch (error) {
        if (!(error instanceof BookNotAvailableException)) {
          throw error;
        }

        // If we get here, the preferred copy (or any copy) is not available
        this.logger.warn(
          `No available copy found for book ${request.book.id}` +
            (preferredCopyId ? ` (preferred copy: ${preferredCopyId})` : ''),
        );

        // Save the approved request first
        await transactionalEntityManager.save(BookRequest, request);

        // Add to queue if not already in queue
        if (!request.queueEntry) {
          const queueEntry = await this.queueService.addToQueue(
            request.book.id.toString(),
            request.user.id,
          );
          request.queueEntry = queueEntry;
          request.queueEntryId = queueEntry.id;
          await transactionalEntityManager.save(BookRequest, request);
          return { queueEntry };
        }

        return { queueEntry: request.queueEntry };
      }
    });
  }

  async rejectRequest(
    requestId: string,
    reason: string,
    rejectedById: string,
  ): Promise<BookRequest> {
    return this.dataSource.transaction(async (transactionalEntityManager) => {
      const request = await transactionalEntityManager.findOne(BookRequest, {
        where: { id: requestId },
        relations: ['queueEntry', 'user', 'book'], // Add user and book relations
      });

      if (!request) {
        throw new NotFoundException('Request not found');
      }

      if (request.status !== BookRequestStatus.PENDING) {
        throw new ConflictException('Request is not in a pending state');
      }

      // Update request status
      request.status = BookRequestStatus.REJECTED;
      request.rejectedAt = new Date();
      request.rejectionReason = reason;
      request.rejectedBy = { id: rejectedById } as User;
      request.rejectedById = rejectedById;

      // If there's an associated queue entry, remove it
      if (request.queueEntry) {
        await transactionalEntityManager.remove(QueueEntry, request.queueEntry);
      }

      // Send email notification (only if user exists)
      if (request.user && request.user.email) {
        await this.emailUtilsService.sendRequestRejectedEmail(
          request.user,
          request.book,
          reason,
          rejectedById,
        );
      } else {
        this.logger.warn(`Cannot send rejection email: user or user.email is undefined for request ${requestId}`);
      }

      return transactionalEntityManager.save(BookRequest, request);
    });
  }

  async cancelRequest(requestId: string, userId: string): Promise<BookRequest> {
    const request = await this.bookRequestRepository.findOne({
      where: { id: requestId, user: { id: userId } },
      relations: ['queueEntry'],
    });

    if (!request) {
      throw new NotFoundException('Request not found');
    }

    if (request.status !== BookRequestStatus.PENDING) {
      throw new ConflictException('Only pending requests can be cancelled');
    }

    request.status = BookRequestStatus.CANCELLED;

    // If there's an associated queue entry, remove it
    if (request.queueEntry) {
      await this.queueEntryRepository.remove(request.queueEntry);
    }

    return this.bookRequestRepository.save(request);
  }

  async getUserRequests(userId: string): Promise<BookRequest[]> {
    return this.bookRequestRepository.find({
      where: { user: { id: userId } },
      relations: ['book', 'queueEntry', 'approvedBy', 'rejectedBy'],
      order: { createdAt: 'DESC' },
    });
  }

  async getBookRequests(bookId: string): Promise<BookRequest[]> {
    return this.bookRequestRepository.find({
      where: { book: { id: Number(bookId) } },
      relations: ['user', 'queueEntry', 'approvedBy', 'rejectedBy'],
      order: { createdAt: 'ASC' },
    });
  }

  async getRequestById(requestId: string): Promise<BookRequest> {
    const request = await this.bookRequestRepository.findOne({
      where: { id: requestId },
      relations: ['user', 'book', 'queueEntry', 'approvedBy', 'rejectedBy'],
    });

    if (!request) {
      throw new NotFoundException('Request not found');
    }

    return request;
  }

  async findAll(filters?: {
    status?: BookRequestStatus;
  }): Promise<BookRequest[]> {
    const query = this.bookRequestRepository
      .createQueryBuilder('request')
      .leftJoinAndSelect('request.user', 'user')
      .leftJoinAndSelect('request.book', 'book')
      .leftJoinAndSelect('book.copies', 'copies')
      .leftJoinAndSelect('request.queueEntry', 'queueEntry')
      .leftJoinAndSelect('request.approvedBy', 'approvedBy')
      .leftJoinAndSelect('request.rejectedBy', 'rejectedBy');

    if (filters?.status) {
      query.andWhere('request.status = :status', { status: filters.status });
    }

    return (await query.getMany()).reverse();
  }

  /**
   * Creates a renewal request for an existing loan
   */
  async createRenewalRequest(
    loanId: string,
    userId: string,
    reason?: string,
  ): Promise<BookRequest> {
    return this.dataSource.transaction(async (transactionalEntityManager) => {
      // 1️⃣ Check if the loan exists and belongs to the user
      const loan = await transactionalEntityManager.findOne(BookLoan, {
        where: { id: loanId },
        relations: ['user', 'bookCopy', 'bookCopy.book'],
      });

      if (!loan) {
        throw new NotFoundException('Loan not found');
      }

      if (loan.user.id !== userId) {
        throw new ConflictException('You can only request renewal for your own loans');
      }

      if (loan.status !== LoanStatus.ACTIVE) {
        throw new ConflictException('Only active loans can be renewed');
      }

      // 2️⃣ Check if there's already a pending renewal request for this loan
      const existingRenewalRequest = await transactionalEntityManager.findOne(
        BookRequest,
        {
          where: {
            loanId: loanId,
            requestType: BookRequestType.RENEWAL,
            status: In([BookRequestStatus.RENEWAL_PENDING]),
          },
        },
      );

      if (existingRenewalRequest) {
        throw new ConflictException('A renewal request for this loan is already pending');
      }

      // 3️⃣ Check membership validity
      const membership =
        await this.membershipService.findActiveMembership(userId);
      if (!membership) {
        throw new BadRequestException(
          'Active membership is required to request renewals',
        );
      }

      // 4️⃣ Check renewal limits
      const maxRenewals = membership.type?.renewalLimit ?? 2;
      if (loan.renewalCount >= maxRenewals) {
        throw new ConflictException(
          `Maximum renewal limit (${maxRenewals}) reached for this loan`,
        );
      }

      // 5️⃣ Check for pending book requests (other users wanting this book)
      const hasPendingRequests =
        (await this.bookRequestRepository.count({
          where: {
            book: { id: loan.bookCopy.book.id },
            status: BookRequestStatus.PENDING,
            user: { id: Not(userId) },
            requestType: BookRequestType.BORROW,
          },
        })) > 0;

      if (hasPendingRequests) {
        throw new ConflictException(
          'This book has been requested by another user and cannot be renewed',
        );
      }

      // 6️⃣ Create the renewal request
      const renewalRequest = transactionalEntityManager.create(BookRequest, {
        user: { id: userId },
        book: { id: loan.bookCopy.book.id },
        loanId: loanId,
        requestType: BookRequestType.RENEWAL,
        status: BookRequestStatus.RENEWAL_PENDING,
        reason: reason || 'Request for loan renewal',
      });

      const savedRequest = await transactionalEntityManager.save(
        BookRequest,
        renewalRequest,
      );

      this.logger.log(
        `Renewal request created: ${savedRequest.id} for loan: ${loanId} by user: ${userId}`,
      );

      return savedRequest;
    });
  }

  /**
   * Approves a renewal request and processes the renewal
   */
  async approveRenewalRequest(
    requestId: string,
    approvedById: string,
    reason?: string,
  ): Promise<BookLoan> {
    return this.dataSource.transaction(async (transactionalEntityManager) => {
      const request = await transactionalEntityManager.findOne(BookRequest, {
        where: { id: requestId },
        relations: ['user', 'book', 'loan'],
      });

      if (!request) {
        throw new NotFoundException('Renewal request not found');
      }

      if (request.status !== BookRequestStatus.RENEWAL_PENDING) {
        throw new ConflictException('Request is not in a pending state');
      }

      if (request.requestType !== BookRequestType.RENEWAL) {
        throw new ConflictException('This is not a renewal request');
      }

      // Get active membership for the user
      const activeMembership = await this.membershipService.findActiveMembership(request.user.id);
      if (!activeMembership) {
        throw new BadRequestException(
          'Active membership is required to renew books',
        );
      }

      // Update request status
      request.status = BookRequestStatus.RENEWAL_APPROVED;
      request.approvedAt = new Date();
      request.approvedBy = { id: approvedById } as User;
      request.approvedById = approvedById;
      if (reason) {
        request.reason = reason;
      }

      await transactionalEntityManager.save(BookRequest, request);

      // Process the actual renewal
      // Use the transactionalEntityManager to avoid nested transactions
      const loan = await transactionalEntityManager.findOne(BookLoan, {
        where: { id: request.loanId! },
        relations: ['user', 'bookCopy', 'bookCopy.book'],
      });

      if (!loan) throw new NotFoundException('Loan not found');
      if (loan.user.id !== request.user.id)
        throw new ConflictException('You can only renew your own loans');
      if (loan.status !== LoanStatus.ACTIVE)
        throw new ConflictException('Only active loans can be renewed');

      const hasPendingRequests =
        (await transactionalEntityManager.count(BookRequest, {
          where: {
            book: { id: loan.bookCopy.book.id },
            status: BookRequestStatus.PENDING,
            user: { id: Not(request.user.id) },
          },
        })) > 0;

      if (hasPendingRequests) {
        throw new ConflictException(
          'This book has been requested by another user and cannot be renewed',
        );
      }

      let membershipType;
      if (activeMembership.type && typeof activeMembership.type === 'object') {
        membershipType = activeMembership.type;
      } else {
        // For simplicity, use default renewal limits
        membershipType = { renewalLimit: 3, maxDurationDays: 14 };
      }

      const maxRenewals = membershipType?.renewalLimit ?? 3;
      if (loan.renewalCount >= maxRenewals) {
        throw new ConflictException(`Maximum renewal limit (${maxRenewals}) reached`);
      }

      const baseDate = loan.dueDate > new Date() ? loan.dueDate : new Date();
      const newDueDate = new Date(baseDate);
      const renewalPeriod = membershipType?.maxDurationDays ?? 14;
      newDueDate.setDate(newDueDate.getDate() + renewalPeriod);

      loan.dueDate = newDueDate;
      loan.renewalCount += 1;
      loan.lastRenewedAt = new Date();
      loan.updatedAt = new Date();

      const updatedLoan = await transactionalEntityManager.save(BookLoan, loan);

      this.logger.log(
        `Renewal request approved: ${requestId}, loan renewed: ${updatedLoan.id}`,
      );

      return updatedLoan;
    });
  }

  /**
   * Rejects a renewal request
   */
  async rejectRenewalRequest(
    requestId: string,
    rejectedById: string,
    reason?: string,
  ): Promise<BookRequest> {
    const request = await this.bookRequestRepository.findOne({
      where: { id: requestId },
      relations: ['user', 'loan'],
    });

    if (!request) {
      throw new NotFoundException('Renewal request not found');
    }

    if (request.status !== BookRequestStatus.RENEWAL_PENDING) {
      throw new ConflictException('Request is not in a pending state');
    }

    if (request.requestType !== BookRequestType.RENEWAL) {
      throw new ConflictException('This is not a renewal request');
    }

    // Update request status
    request.status = BookRequestStatus.RENEWAL_REJECTED;
    request.rejectedAt = new Date();
    request.rejectionReason = reason || 'Renewal request rejected';
    request.rejectedBy = { id: rejectedById } as User;
    request.rejectedById = rejectedById;

    const savedRequest = await this.bookRequestRepository.save(request);

    this.logger.log(
      `Renewal request rejected: ${requestId}, reason: ${reason}`,
    );

    return savedRequest;
  }

  /**
   * Get all renewal requests with optional status filter
   */
  async findRenewalRequests(status?: BookRequestStatus): Promise<BookRequest[]> {
    const query = this.bookRequestRepository
      .createQueryBuilder('request')
      .leftJoinAndSelect('request.user', 'user')
      .leftJoinAndSelect('request.book', 'book')
      .leftJoinAndSelect('request.loan', 'loan')
      .leftJoinAndSelect('loan.bookCopy', 'bookCopy')
      .leftJoinAndSelect('request.approvedBy', 'approvedBy')
      .leftJoinAndSelect('request.rejectedBy', 'rejectedBy')
      .where('request.requestType = :requestType', {
        requestType: BookRequestType.RENEWAL,
      });

    if (status) {
      query.andWhere('request.status = :status', { status });
    }

    return (await query.getMany()).reverse();
  }
}
