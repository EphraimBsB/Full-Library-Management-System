import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
  Inject,
  forwardRef,
  Logger
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan, MoreThan, Not, In, DataSource, EntityManager } from 'typeorm';
import { BookLoan, LoanStatus } from '../entities/book-loan.entity';
import { BookCopy, BookCopyStatus } from '../entities/book-copy.entity';
import { QueueEntry, QueueStatus } from '../entities/queue-entry.entity';
import { BookRequest, BookRequestStatus } from '../entities/book-request.entity';
import { User } from '../../users/entities/user.entity';
import { Book } from '../entities/book.entity';
import { CreateLoanDto } from '../dto/create-loan.dto';
import { BookNotAvailableException } from '../exceptions/book-not-available.exception';
import { QueueService } from './queue.service';
import { LoanLimitExceededException, RenewalLimitExceededException, RenewalCooldownException } from '../exceptions/book-loan.exceptions';
import type { ConfigType } from '@nestjs/config';
import loanConfig from '../config/loan.config';
import { EmailUtilsService } from '../../emails/email-utils.service';
import { MembershipService } from '../../membership/membership.service';

@Injectable()
export class BookLoanService {
  private readonly logger = new Logger(BookLoanService.name);
  private readonly loanPeriodDays = 14; // Default loan period in days

  constructor(
    @InjectRepository(BookLoan)
    private readonly bookLoanRepository: Repository<BookLoan>,
    @InjectRepository(BookRequest)
    private readonly bookRequestRepository: Repository<BookRequest>,
    @Inject(forwardRef(() => QueueService))
    private readonly queueService: QueueService,
    private dataSource: DataSource,
    private readonly emailUtilsService: EmailUtilsService,
    private readonly membershipService: MembershipService,
    @Inject(loanConfig.KEY)
    private readonly loanConfig: {
      maxLoansPerUser: number;
      loanPeriodDays: number;
      renewalDays: number;
      maxRenewals: number;
      dailyFineAmount: number;
    }
  ) { }


  /**
   * Creates a new book loan if a copy is available
   */

  /**
   */
  async createLoan(
    manager: EntityManager,
    createLoanDto: CreateLoanDto
  ): Promise<BookLoan> {
    const { bookId, preferredCopyId, userId, requestId } = createLoanDto;

    if (!bookId && !preferredCopyId) {
      throw new BadRequestException('Either bookId or preferredCopyId must be provided');
    }

    // 1️⃣ Check membership validity and rules
    const activeMembership = await this.membershipService.findActiveMembership(userId);
    if (!activeMembership) {
      throw new BadRequestException('Active membership required to borrow books');
    }

    const maxLoans = activeMembership.type.maxBooks;
    const loanPeriodDays = activeMembership.type.maxDurationDays || this.loanPeriodDays;

    // Use the passed manager directly (no nested transaction)
    const transactionalEntityManager = manager;

    // 2️⃣ Check current active loan count for user
    const activeLoansCount = await transactionalEntityManager.count(BookLoan, {
      where: {
        user: { id: userId },
        status: In([LoanStatus.ACTIVE, LoanStatus.OVERDUE]),
      },
    });

    if (activeLoansCount >= maxLoans) {
      throw new LoanLimitExceededException(maxLoans);
    }

    // 3️⃣ Select available copy (preferred or first available)
    let availableCopy: BookCopy | null = null;

    if (preferredCopyId) {
      const preferredCopyIdNumber = parseInt(preferredCopyId, 10);

      const query = transactionalEntityManager
        .createQueryBuilder(BookCopy, 'copy')
        .where('copy.id = :id', { id: preferredCopyIdNumber })
        .andWhere('copy.status = :status', { status: BookCopyStatus.AVAILABLE });

      if (bookId) {
        query.andWhere('copy.bookId = :bookId', { bookId: Number(bookId) });
      }

      availableCopy = await query.setLock('pessimistic_write').getOne();

      if (!availableCopy) {
        throw new BookNotAvailableException('The specified copy is not available');
      }
    } else {
      availableCopy = await transactionalEntityManager
        .createQueryBuilder(BookCopy, 'copy')
        .where('copy.bookId = :bookId', { bookId: Number(bookId) })
        .andWhere('copy.status = :status', { status: BookCopyStatus.AVAILABLE })
        .setLock('pessimistic_write')
        .getOne();

      if (!availableCopy) {
        throw new BookNotAvailableException('No available copies of this book');
      }
    }

    // 4️⃣ Prevent duplicate active loans for the same book (not just same copy)
    const existingLoan = await transactionalEntityManager.findOne(BookLoan, {
      where: {
        user: { id: userId },
        status: In([LoanStatus.ACTIVE, LoanStatus.OVERDUE]),
        bookCopy: { book: { id: Number(bookId) } },
      },
      relations: ['bookCopy', 'bookCopy.book'],
    });

    if (existingLoan) {
      throw new ConflictException('You already have an active loan for this book');
    }

    // 5️⃣ Compute loan dates
    const borrowedAt = new Date();
    const dueDate = new Date(borrowedAt);
    dueDate.setDate(borrowedAt.getDate() + loanPeriodDays);

    // 6️⃣ Fetch minimal user + book data (for email + notifications)
    const [user, book] = await Promise.all([
      transactionalEntityManager.findOne(User, {
        where: { id: userId },
        select: ['id', 'firstName', 'lastName', 'email', 'phoneNumber', 'rollNumber'],
      }),
      transactionalEntityManager.findOne(Book, {
        where: { id: Number(bookId) },
        select: ['id', 'title', 'author'],
      }),
    ]);

    if (!user) throw new NotFoundException('User not found');
    if (!book) throw new NotFoundException('Book not found');

    // 7️⃣ Create loan
    const loanId = crypto.randomUUID(); // cleaner than require('uuid')
    const loan = transactionalEntityManager.create(BookLoan, {
      id: loanId,
      user: { id: userId },
      bookCopy: { id: availableCopy.id },
      borrowedAt,
      dueDate,
      status: LoanStatus.ACTIVE,
      renewalCount: 0,
      requestId: requestId || null,
    });

    const savedLoan = await transactionalEntityManager.save(BookLoan, loan);

    // 8️⃣ Update book copy status
    availableCopy.status = BookCopyStatus.BORROWED;
    await transactionalEntityManager.save(BookCopy, availableCopy);

    // 9️⃣ Link loan to request (if any)
    if (requestId) {
      await transactionalEntityManager.update(
        BookRequest,
        { id: requestId },
        {
          status: BookRequestStatus.FULFILLED,
          fulfilledAt: new Date(),
          loanId: savedLoan.id,
        },
      );
    }

    // 🔟 Fire-and-forget notifications
    try {
      this.emailUtilsService.sendLoanConfirmationEmail(
        user,
        book,
        dueDate,
        borrowedAt,
        savedLoan.id,
      );
    } catch (err) {
      this.logger.warn(`Failed to send loan confirmation for loan ${savedLoan.id}: ${err.message}`);
    }

    try {
      this.emailUtilsService.scheduleReturnReminder(
        savedLoan.id,
        user,
        book,
        dueDate,
        borrowedAt,
      );
    } catch (err) {
      this.logger.warn(`Failed to schedule reminder for loan ${savedLoan.id}: ${err.message}`);
    }

    return savedLoan;
  }


  async returnBook(loanId: string, returnedById: string): Promise<BookLoan> {
    return this.dataSource.transaction(async (transactionalEntityManager) => {
      // 1. Find the loan with a lock to prevent concurrent modifications
      const loan = await transactionalEntityManager.findOne(BookLoan, {
        where: { id: loanId },
        relations: ['bookCopy', 'user'],
        lock: { mode: 'pessimistic_write' }
      });

      if (!loan) {
        throw new NotFoundException('Loan not found');
      }

      if (![LoanStatus.ACTIVE, LoanStatus.OVERDUE].includes(loan.status)) {
        throw new ConflictException('This loan cannot be returned');
      }

      // 2. Update loan
      loan.returnedAt = new Date();
      loan.returnedBy = returnedById;
      loan.status = LoanStatus.RETURNED;

      // 3. Update book copy status
      const bookCopy = await transactionalEntityManager.findOne(BookCopy, {
        where: { id: loan.bookCopy.id }
      });

      if (bookCopy) {
        bookCopy.status = BookCopyStatus.AVAILABLE;
        await transactionalEntityManager.save(BookCopy, bookCopy);
      }

      // 4. Save the updated loan
      const updatedLoan = await transactionalEntityManager.save(BookLoan, loan);

      // 5. Process queue for this book (outside transaction) if bookCopy exists
      if (bookCopy) {
        this.queueService.processNextInQueue(bookCopy.bookId.toString())
          .catch(error => {
            this.logger.error(`Error processing queue after returning book ${loanId}:`, error);
          });
      }

      // 6. Send return confirmation email in the background
      this.sendReturnConfirmation(updatedLoan).catch(error => {
        this.logger.error(
          `Failed to send return confirmation for loan ${updatedLoan.id}: ${error.message}`,
          error.stack
        );
      });

      return updatedLoan;
    });
  }

  /**
   * Renews a book loan if allowed
   */
  async renewLoan(loanId: string, userId: string): Promise<BookLoan> {
    // Check membership status first
    const activeMembership = await this.membershipService.findActiveMembership(userId);
    if (!activeMembership) {
      throw new BadRequestException('Active membership is required to renew books');
    }

    return this.dataSource.transaction(async (transactionalEntityManager) => {
      // 1. Find the loan with a lock to prevent concurrent renewals
      const loan = await transactionalEntityManager.findOne(BookLoan, {
        where: { id: loanId },
        relations: ['user', 'bookCopy', 'bookCopy.book'],
        lock: { mode: 'pessimistic_write' }
      });

      if (!loan) {
        throw new NotFoundException('Loan not found');
      }

      if (loan.user.id !== userId) {
        throw new ConflictException('You can only renew your own loans');
      }

      if (loan.status !== LoanStatus.ACTIVE) {
        throw new ConflictException('Only active loans can be renewed');
      }

      // 2. Check if the book is requested by another user
      const hasPendingRequests = await this.bookRequestRepository.count({
        where: {
          book: { id: loan.bookCopy.book.id },
          status: BookRequestStatus.PENDING,
          userId: Not(userId)
        }
      }) > 0;

      if (hasPendingRequests) {
        throw new ConflictException('This book has been requested by another user and cannot be renewed');
      }

      // 3. Check renewal limit based on membership
      const maxRenewals = activeMembership.type.renewalLimit;
      if (loan.renewalCount >= maxRenewals) {
        throw new RenewalLimitExceededException(maxRenewals);
      }

      // 4. Calculate new due date based on membership type
      const newDueDate = new Date(loan.dueDate);
      const renewalPeriod = activeMembership.type.maxDurationDays;
      newDueDate.setDate(newDueDate.getDate() + renewalPeriod);

      // 5. Update loan
      loan.dueDate = newDueDate;
      loan.renewalCount += 1;
      loan.lastRenewedAt = new Date();
      loan.updatedAt = new Date();

      const updatedLoan = await transactionalEntityManager.save(BookLoan, loan);

      // 5. Send renewal confirmation email in the background
      this.sendRenewalConfirmation(updatedLoan, newDueDate).catch(error => {
        this.logger.error(
          `Failed to send renewal confirmation for loan ${updatedLoan.id}: ${error.message}`,
          error.stack
        );
      });

      return updatedLoan;
    });
  }

  /**
   * Gets all active loans for a user
   */
  async getUserLoans(userId: string): Promise<BookLoan[]> {
    return this.bookLoanRepository.find({
      where: {
        user: { id: userId },
        status: LoanStatus.ACTIVE
      },
      relations: ['bookCopy', 'bookCopy.book'],
      order: { dueDate: 'ASC' },
    });
  }

  /**
   * Gets all overdue loans
   */
  async getOverdueLoans(): Promise<BookLoan[]> {
    return this.bookLoanRepository.find({
      where: {
        status: LoanStatus.ACTIVE,
        dueDate: LessThan(new Date())
      },
      relations: ['user', 'bookCopy', 'bookCopy.book'],
      order: { dueDate: 'ASC' },
    });
  }

  /**
   * Gets a loan by ID
   */
  /**
   * Find all book loans with optional filters
   * @param options Optional filters for status, userId, and bookId
   */
  async findAll(options?: {
    status?: LoanStatus;
    userId?: string;
    bookId?: string;
  }): Promise<BookLoan[]> {
    const query = this.bookLoanRepository.createQueryBuilder('loan')
      .leftJoinAndSelect('loan.user', 'user')
      .leftJoinAndSelect('loan.bookCopy', 'bookCopy')
      .leftJoinAndSelect('bookCopy.book', 'book')
      .leftJoinAndSelect('loan.request', 'request');

    if (options?.status) {
      query.andWhere('loan.status = :status', { status: options.status });
    }

    if (options?.userId) {
      query.andWhere('loan.userId = :userId', { userId: options.userId });
    }

    if (options?.bookId) {
      query.andWhere('book.id = :bookId', { bookId: options.bookId });
    }

    return query.orderBy('loan.borrowedAt', 'DESC').getMany();
  }

  /**
   * Gets a loan by ID
   */
  async getBookLoan(bookLoanId: string): Promise<BookLoan> {
    const loan = await this.bookLoanRepository.findOne({
      where: { id: bookLoanId },
      relations: ['user', 'bookCopy', 'bookCopy.book', 'request']
    });

    if (!loan) {
      throw new NotFoundException(`Book loan with ID ${bookLoanId} not found`);
    }

    return loan;
  }

  /**
   * Checks for overdue loans, updates their status, and sends notifications
   */
  async checkOverdueLoans(): Promise<{ updated: number; notified: number }> {
    const overdueLoans = await this.bookLoanRepository.find({
      where: {
        status: LoanStatus.ACTIVE,
        dueDate: LessThan(new Date())
      },
      relations: ['user', 'bookCopy', 'bookCopy.book']
    });

    let updated = 0;
    let notified = 0;

    for (const loan of overdueLoans) {
      try {
        // Update loan status to OVERDUE
        loan.status = LoanStatus.OVERDUE;
        await this.bookLoanRepository.save(loan);
        updated++;

        // Send overdue notice in the background
        this.sendOverdueNotice(loan).catch(error => {
          this.logger.error(
            `Failed to send overdue notice for loan ${loan.id}: ${error.message}`,
            error.stack
          );
        });

        notified++;
        this.logger.log(`Marked loan ${loan.id} as overdue and sent notice to user ${loan.user.id}`);
      } catch (error) {
        this.logger.error(`Error processing overdue loan ${loan.id}:`, error);
      }
    }

    return { updated, notified };
  }

  /**
   * Calculates the fine for an overdue book loan
   * @param bookLoanId The ID of the book loan
   * @returns The calculated fine amount
   */
  async calculateFine(bookLoanId: string): Promise<number> {
    const bookLoan = await this.getBookLoan(bookLoanId);
    const now = new Date();

    // No fine if not active or not overdue
    if (bookLoan.status !== LoanStatus.ACTIVE || now <= bookLoan.dueDate) {
      return 0;
    }

    // Get membership for fine calculation
    const membership = await this.membershipService.findActiveMembership(bookLoan.user.id);

    // Check for grace period (premium members might have one)
    const gracePeriodDays = membership?.type.name === 'premium' ? 2 : 0;
    const gracePeriodEnd = new Date(bookLoan.dueDate);
    gracePeriodEnd.setDate(gracePeriodEnd.getDate() + gracePeriodDays);

    if (now <= gracePeriodEnd) {
      return 0; // Within grace period
    }

    // Calculate days overdue (excluding grace period)
    const daysOverdue = Math.ceil((now.getTime() - gracePeriodEnd.getTime()) / (1000 * 60 * 60 * 24));

    // Apply membership-specific fine rate
    const dailyFine = membership?.type.fineRate || this.loanConfig.dailyFineAmount;

    return Math.max(0, daysOverdue * dailyFine);
  }

  /**
   * Sends a loan renewal confirmation email (fire and forget)
   */
  private async sendRenewalConfirmation(loan: BookLoan, newDueDate: Date): Promise<void> {
    try {
      const { user, bookCopy } = loan;
      if (!user || !bookCopy?.book) {
        throw new Error('Missing required loan data for sending renewal confirmation');
      }

      await this.emailUtilsService.sendEmail(
        user.email,
        `Loan Renewal Confirmation: ${bookCopy.book.title}`,
        'renewal-confirmation',
        {
          userName: `${user.firstName} ${user.lastName}`,
          bookTitle: bookCopy.book.title,
          bookAuthor: bookCopy.book.author,
          newDueDate: newDueDate.toLocaleDateString(),
          supportEmail: 'library@example.com',
        }
      );

      this.logger.log(`Sent renewal confirmation for loan ${loan.id} to ${user.email}`);
    } catch (error) {
      this.logger.error(
        `Error in sendRenewalConfirmation for loan ${loan?.id}: ${error.message}`,
        error.stack
      );
      throw error; // Re-throw to be caught by the caller
    }
  }

  /**
   * Sends a return confirmation email (fire and forget)
   */
  private async sendReturnConfirmation(loan: BookLoan): Promise<void> {
    try {
      const { user, bookCopy, returnedAt } = loan;
      if (!user || !bookCopy?.book || !returnedAt) {
        throw new Error('Missing required loan data for sending return confirmation');
      }

      await this.emailUtilsService.sendEmail(
        user.email,
        `Book Return Confirmation: ${bookCopy.book.title}`,
        'return-confirmation',
        {
          userName: `${user.firstName} ${user.lastName}`,
          bookTitle: bookCopy.book.title,
          bookAuthor: bookCopy.book.author,
          returnDate: new Date(returnedAt).toLocaleDateString(),
          supportEmail: 'library@example.com',
        }
      );

      this.logger.log(`Sent return confirmation for loan ${loan.id} to ${user.email}`);
    } catch (error) {
      this.logger.error(
        `Error in sendReturnConfirmation for loan ${loan?.id}: ${error.message}`,
        error.stack
      );
      throw error; // Re-throw to be caught by the caller
    }
  }

  /**
   * Sends an overdue notice for a loan (fire and forget)
   */
  private async sendOverdueNotice(loan: BookLoan): Promise<void> {
    try {
      const { user, bookCopy, dueDate } = loan;
      if (!user || !bookCopy?.book || !dueDate) {
        throw new Error('Missing required loan data for sending overdue notice');
      }

      // Calculate days overdue
      const daysOverdue = Math.ceil((new Date().getTime() - new Date(dueDate).getTime()) / (1000 * 60 * 60 * 24));

      // Get membership for fine calculation
      const membership = await this.membershipService.findActiveMembership(user.id);
      const dailyFine = membership?.type.fineRate || this.loanConfig.dailyFineAmount;
      const fineAmount = daysOverdue * dailyFine;

      await this.emailUtilsService.sendEmail(
        user.email,
        `Overdue Notice: ${bookCopy.book.title}`,
        'overdue-notice',
        {
          userName: `${user.firstName} ${user.lastName}`,
          bookTitle: bookCopy.book.title,
          bookAuthor: bookCopy.book.author,
          dueDate: new Date(dueDate).toLocaleDateString(),
          daysOverdue,
          fineAmount: fineAmount.toFixed(2),
          supportEmail: 'library@example.com',
        }
      );

      this.logger.log(`Sent overdue notice for loan ${loan.id} to ${user.email}`);
    } catch (error) {
      this.logger.error(
        `Error in sendOverdueNotice for loan ${loan?.id}: ${error.message}`,
        error.stack
      );
      throw error; // Re-throw to be caught by the caller
    }
  }
}
