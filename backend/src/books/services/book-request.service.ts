import {
  Injectable,
  NotFoundException,
  ConflictException,
  Inject,
  forwardRef,
  Logger,
  BadRequestException
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource, In } from 'typeorm';
import { BookRequest, BookRequestStatus } from '../entities/book-request.entity';
import { User } from '../../users/entities/user.entity';
import { Book } from '../entities/book.entity';
import { BookCopy, BookCopyStatus } from '../entities/book-copy.entity';
import { QueueEntry, QueueStatus } from '../entities/queue-entry.entity';
import { BookLoan, LoanStatus } from '../entities/book-loan.entity';
import { BookLoanService } from './book-loan.service';
import { QueueService } from './queue.service';
import { BookNotAvailableException } from '../exceptions/book-not-available.exception';
import { MembershipService, MembershipStatus } from 'src/membership/membership.service';
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
  ) { }

  async createRequest(bookId: string, userId: string, reason?: string): Promise<BookRequest> {
  return this.dataSource.transaction(async (transactionalEntityManager) => {
    // 1️⃣ Check membership status
    const membership = await this.membershipService.findActiveMembership(userId);
    if (!membership) {
      throw new BadRequestException('Active membership is required to request books');
    }

    if (membership.status !== MembershipStatus.ACTIVE) {
      throw new BadRequestException(`Membership is ${membership.status.toLowerCase()}`);
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
      throw new ConflictException('You already have a request or queue entry for this book');
    }

    if (existingLoan) {
      throw new ConflictException('You already have an active loan for this book');
    }

    // 4️⃣ Decide: Request or Queue
    let status: BookRequestStatus;
    let queueEntryId: string | null = null;

    if (book.copies.filter(copy => copy.status === BookCopyStatus.AVAILABLE).length > 0) {
      // There are available copies → normal request
      status = BookRequestStatus.PENDING;
    } else {
      // No copies → automatically join the queue
      status = BookRequestStatus.QUEUED;

      // Create queue entry (outside the transaction manager to reuse your QueueService)
      const queueEntry = await this.queueService.addToQueue(bookId, userId, transactionalEntityManager);
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

    const savedRequest = await transactionalEntityManager.save(BookRequest, request);

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
    preferredCopyId?: string
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
        const loan = await this.bookLoanService.createLoan(transactionalEntityManager, {
          preferredCopyId,
          bookId: request.book.id.toString(),
          userId: request.user.id,
          requestId: request.id,
          approvedById
        });

        // If we get here, the loan was created successfully
        request.status = BookRequestStatus.FULFILLED;
        request.fulfilledAt = new Date();
        // Update the request with the loan information
        await transactionalEntityManager.update(BookRequest, request.id, {
          status: BookRequestStatus.FULFILLED,
          fulfilledAt: new Date(),
          approvedById,
          loanId: loan.id
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
          (preferredCopyId ? ` (preferred copy: ${preferredCopyId})` : '')
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
    rejectedById: string
  ): Promise<BookRequest> {
    return this.dataSource.transaction(async (transactionalEntityManager) => {
      const request = await transactionalEntityManager.findOne(BookRequest, {
        where: { id: requestId },
        relations: ['queueEntry'],
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

      // Send email notification
      await this.emailUtilsService.sendRequestRejectedEmail(
        request.user,
        request.book,
        reason,
        rejectedById,
      );

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

  async findAll(filters?: { status?: BookRequestStatus }): Promise<BookRequest[]> {
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
}
