import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
  Inject,
  forwardRef,
  Logger,
} from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import {
  Repository,
  LessThan,
  MoreThan,
  Not,
  In,
  DataSource,
  EntityManager,
} from 'typeorm';
import { BookLoan, LoanStatus } from '../entities/book-loan.entity';
import { BookCopy, BookCopyStatus } from '../entities/book-copy.entity';
import { QueueEntry, QueueStatus } from '../entities/queue-entry.entity';
import {
  BookRequest,
  BookRequestStatus,
} from '../entities/book-request.entity';
import { User } from '../../users/entities/user.entity';
import { Book } from '../entities/book.entity';
import { CreateLoanDto } from '../dto/create-loan.dto';
import { BookNotAvailableException } from '../exceptions/book-not-available.exception';
import { QueueService } from './queue.service';
import {
  LoanLimitExceededException,
  RenewalLimitExceededException,
  RenewalCooldownException,
} from '../exceptions/book-loan.exceptions';
import type { ConfigType } from '@nestjs/config';
import loanConfig from '../config/loan.config';
import { EmailUtilsService } from '../../emails/email-utils.service';
import { MembershipService } from '../../membership/membership.service';
import { BookMetadata } from '../entities/book-metadata.entity';
import { MembershipType } from 'src/sys-configs/membership-types/entities/membership-type.entity';
import { PaginatedResponseDto } from '../../common/dto/paginated-response.dto';
import { PaginationOptions } from '../../common/interfaces/pagination-options.interface';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import type { Cache } from 'cache-manager';

@Injectable()
export class BookLoanService {
  private readonly logger = new Logger(BookLoanService.name);
  private readonly loanPeriodDays = 14;
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
    @InjectRepository(MembershipType)
    private readonly membershipTypeRepository: Repository<MembershipType>,
    @Inject(loanConfig.KEY)
    private readonly loanConfig: {
      maxLoansPerUser: number;
      loanPeriodDays: number;
      renewalDays: number;
      maxRenewals: number;
      dailyFineAmount: number;
    },
    @Inject(CACHE_MANAGER)
    private readonly cacheManager: Cache,
  ) {}

  private async resetCache(): Promise<void> {
    const store: any = (this.cacheManager as any).store;
    if (store && typeof store.reset === 'function') {
      await store.reset();
    }
  }

  private getLoansListCacheKey(
    options: {
      status?: LoanStatus;
      userId?: string;
      bookId?: string;
    } & PaginationOptions,
  ): string {
    const page = options.page && options.page > 0 ? options.page : 1;
    const limit = options.limit && options.limit > 0 ? options.limit : 10;
    const normalized = {
      status: options.status || null,
      userId: options.userId || null,
      bookId: options.bookId || null,
      page,
      limit,
    };
    return `loans:list:${JSON.stringify(normalized)}`;
  }

  private getOverdueLoansCacheKey(userId?: string): string {
    return `loans:overdue:${userId || 'all'}`;
  }

  private getLoanDetailCacheKey(id: string): string {
    return `loans:detail:${id}`;
  }

  /**
   * Creates a new book loan if a copy is available
   */

  /**
   */
  async createLoan(
    manager: EntityManager,
    createLoanDto: CreateLoanDto,
  ): Promise<BookLoan> {
    const { bookId, preferredCopyId, userId, requestId } = createLoanDto;

    if (!bookId && !preferredCopyId) {
      throw new BadRequestException(
        'Either bookId or preferredCopyId must be provided',
      );
    }

    // Use the passed manager directly (no nested transaction)
    const transactionalEntityManager = manager;

    // 0️⃣ Verify library fee payment for students via external API
    const requestingUser = await transactionalEntityManager.findOne(User, {
      where: { id: userId },
      select: ['id', 'rollNumber']
    });
    
    if (requestingUser?.rollNumber) {
      try {
        const response = await fetch(`https://ilimsapi.isbatuniversity.ac.ug:9093/api/LibMember?rollno=${requestingUser.rollNumber}`);
        if (response.ok) {
          const xmlData = await response.text();
          const match = xmlData.match(/<result>(true|false)<\/result>/i);
          if (match && match[1].toLowerCase() === 'false') {
            throw new BadRequestException('Student has not paid the library fee. Library fee payment is required to borrow books.');
          }
        } else {
          this.logger.warn(`Library fee API returned status ${response.status}`);
        }
      } catch (error) {
        if (error instanceof BadRequestException) throw error;
        this.logger.error(`Failed to check library fee for ${requestingUser.rollNumber}`, error);
        throw new BadRequestException('Unable to verify library fee status. Please try again later.');
      }
    }

    // 1️⃣ Check membership validity and rules
    const activeMembership =
      await this.membershipService.findActiveMembership(userId);
    if (!activeMembership) {
      throw new BadRequestException(
        'Active membership required to borrow books',
      );
    }

    const maxLoans = activeMembership.type.maxBooks;
    const loanPeriodDays = activeMembership.type.loanPeriodDays || this.loanPeriodDays;

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
        .andWhere('(copy.status = :availableStatus OR (copy.status = :reservedStatus AND :hasRequest = true))', {
          availableStatus: BookCopyStatus.AVAILABLE,
          reservedStatus: BookCopyStatus.RESERVED,
          hasRequest: !!requestId,
        });

      if (bookId) {
        query.andWhere('copy.bookId = :bookId', { bookId: Number(bookId) });
      }

      availableCopy = await query.setLock('pessimistic_write').getOne();

      if (!availableCopy) {
        throw new BookNotAvailableException(
          'The specified copy is not available',
        );
      }
    } else {
      availableCopy = await transactionalEntityManager
        .createQueryBuilder(BookCopy, 'copy')
        .where('copy.bookId = :bookId', { bookId: Number(bookId) })
        .andWhere('(copy.status = :availableStatus OR (copy.status = :reservedStatus AND :hasRequest = true))', { 
            availableStatus: BookCopyStatus.AVAILABLE,
            reservedStatus: BookCopyStatus.RESERVED,
            hasRequest: !!requestId,
         })
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
      relations: ['bookCopy', 'bookCopy.book', 'bookCopy.book.metadata'],
    });

    if (existingLoan) {
      throw new ConflictException(
        'You already have an active loan for this book',
      );
    }

    // 5️⃣ Compute loan dates using membership loan period
    const borrowedAt = new Date();
    const dueDate = new Date(borrowedAt);
    dueDate.setDate(borrowedAt.getDate() + loanPeriodDays);

    // 6️⃣ Fetch minimal user + book data (for email + notifications)
    const [user, book] = await Promise.all([
      transactionalEntityManager.findOne(User, {
        where: { id: userId },
        select: [
          'id',
          'firstName',
          'lastName',
          'email',
          'phoneNumber',
          'rollNumber',
        ],
      }),
      transactionalEntityManager.findOne(Book, {
        where: { id: Number(bookId) },
        select: ['id', 'title', 'author'],
        relations: ['metadata'],
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

    // 2. Update the book's available copies
    if (book.availableCopies > 0) {
      book.availableCopies -= 1;
      await transactionalEntityManager.save(Book, book);
    }

    // 3. Update the metadata
    if (book.metadata) {
      book.metadata.borrowCount = (book.metadata.borrowCount || 0) + 1;
      await transactionalEntityManager.save(BookMetadata, book.metadata);
    }

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
      this.logger.warn(
        `Failed to send loan confirmation for loan ${savedLoan.id}: ${err.message}`,
      );
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
      this.logger.warn(
        `Failed to schedule reminder for loan ${savedLoan.id}: ${err.message}`,
      );
    }

    const result = savedLoan;
    await this.resetCache();
    return result;
  }

  async returnBook(loanId: string, returnedById: string): Promise<BookLoan> {
    return this.dataSource.transaction(async (transactionalEntityManager) => {
      // 1. Find the loan with a lock to prevent concurrent modifications
      const loan = await transactionalEntityManager.findOne(BookLoan, {
        where: { id: loanId },
        relations: ['bookCopy', 'user', 'bookCopy.book'],
        lock: { mode: 'pessimistic_write' },
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

      // 3. Update book copy status and available copies
      const bookCopy = await transactionalEntityManager.findOne(BookCopy, {
        where: { id: loan.bookCopy.id },
        relations: ['book'],
      });

      if (bookCopy) {
        // Update copy status
        bookCopy.status = BookCopyStatus.AVAILABLE;
        await transactionalEntityManager.save(BookCopy, bookCopy);

        // Update book's available copies and metadata
        if (bookCopy.book) {
          await transactionalEntityManager.update(
            Book,
            { id: bookCopy.book.id },
            {
              availableCopies: () => 'availableCopies + 1',
            }
          );
        }
      }

      // 4. Save the updated loan
      const updatedLoan = await transactionalEntityManager.save(BookLoan, loan);

      // 5. Process queue for this book (outside transaction) if bookCopy exists
      if (bookCopy) {
        this.queueService
          .processNextInQueue(bookCopy.bookId.toString())
          .catch((error) => {
            this.logger.error(
              `Error processing queue after returning book ${loanId}:`,
              error,
            );
          });
      }

      //6. Send email notification to user
      try {
        this.emailUtilsService.sendReturnConfirmationEmail(
          loan.user,
          loan.bookCopy.book,
          loan.returnedAt,
          loan.borrowedAt,
          loan.id,
        );
      } catch (error) {
        this.logger.error(
          `Failed to send return confirmation for loan ${loan.id}: ${error.message}`,
          error.stack,
        );
      }

      // 6. Send return confirmation email in the background
      this.sendReturnConfirmation(updatedLoan).catch((error) => {
        this.logger.error(
          `Failed to send return confirmation for loan ${updatedLoan.id}: ${error.message}`,
          error.stack,
        );
      });

      await this.resetCache();
      return updatedLoan;
    });
  }

  /**
   * Renews a book loan if allowed
   */
  async renewLoan(loanId: string, userId: string): Promise<BookLoan> {
    this.logger.log(`Attempting to renew loan ${loanId} for user ${userId}`);
    
    const activeMembership =
      await this.membershipService.findActiveMembership(userId);
    if (!activeMembership) {
      this.logger.error(`No active membership found for user ${userId}`);
      throw new BadRequestException(
        'Active membership is required to renew books',
      );
    }

    this.logger.log(`Found active membership: ${activeMembership.id}, type: ${activeMembership.type?.name || 'Unknown'}`);

    return this.dataSource.transaction(async (transactionalEntityManager) => {
      const loan = await transactionalEntityManager.findOne(BookLoan, {
        where: { id: loanId },
        relations: ['user', 'bookCopy', 'bookCopy.book'],
      });

      if (!loan) throw new NotFoundException('Loan not found');
      if (loan.user.id !== userId)
        throw new ConflictException('You can only renew your own loans');
      if (loan.status !== LoanStatus.ACTIVE)
        throw new ConflictException('Only active loans can be renewed');

      const hasPendingRequests =
        (await this.bookRequestRepository.count({
          where: {
            book: { id: loan.bookCopy.book.id },
            status: BookRequestStatus.PENDING,
            user: { id: Not(userId) },
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
        this.logger.log(`Using membership type from active membership: ${membershipType.name}`);
      } else {
        this.logger.log(`Looking up membership type with ID: ${activeMembership.type}`);
        membershipType = await this.membershipTypeRepository.findOne({
          where: { id: activeMembership.type },
        });
      }

      if (!membershipType) {
        this.logger.error(`Membership type not found for membership ${activeMembership.id}`);
        throw new BadRequestException('Membership type not found');
      }

      const maxRenewals = membershipType?.renewalLimit ?? this.loanConfig.maxRenewals;
      this.logger.log(`Renewal limits - Current: ${loan.renewalCount}, Max: ${maxRenewals}`);
      
      if (loan.renewalCount >= maxRenewals) {
        this.logger.error(`Renewal limit exceeded: ${loan.renewalCount} >= ${maxRenewals}`);
        throw new RenewalLimitExceededException(maxRenewals);
      }

      const baseDate = loan.dueDate > new Date() ? loan.dueDate : new Date();
      const newDueDate = new Date(baseDate);
      const renewalPeriod = membershipType?.loanPeriodDays ?? 14;
      newDueDate.setDate(newDueDate.getDate() + renewalPeriod);

      loan.dueDate = newDueDate;
      loan.renewalCount += 1;
      loan.lastRenewedAt = new Date();
      loan.updatedAt = new Date();

      const updatedLoan = await transactionalEntityManager.save(BookLoan, loan);

      this.logger.log(
        `Loan ${loan.id} renewed by user ${userId} until ${newDueDate.toISOString()}`,
      );

      this.sendRenewalConfirmation(updatedLoan, newDueDate).catch((error) =>
        this.logger.error(
          `Failed to send renewal confirmation for loan ${updatedLoan.id}: ${error.message}`,
        ),
      );

      await this.resetCache();
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
        status: LoanStatus.ACTIVE,
      },
      relations: ['bookCopy', 'bookCopy.book'],
      order: { dueDate: 'ASC' },
    });
  }

  /**
   * Marks a loan as LOST and charges maximum fine
   * @param loanId The ID of the loan to mark as lost
   * @param markedById The user ID marking the loan as lost
   * @param notes Optional notes about why the book was marked as lost
   */
  async markLoanAsLost(
    loanId: string,
    markedById: string,
    notes?: string,
  ): Promise<BookLoan> {
    return this.dataSource.transaction(async (transactionalEntityManager) => {
      // 1. Find the loan with a lock
      const loan = await transactionalEntityManager.findOne(BookLoan, {
        where: { id: loanId },
        relations: ['bookCopy', 'user', 'bookCopy.book'],
        lock: { mode: 'pessimistic_write' },
      });

      if (!loan) {
        throw new NotFoundException('Loan not found');
      }

      if (![LoanStatus.ACTIVE, LoanStatus.OVERDUE].includes(loan.status)) {
        throw new ConflictException(
          'Only active or overdue loans can be marked as lost',
        );
      }

      // 2. Calculate fine (charge maximum - replacement cost or high fine)
      // For lost books, charge a premium fine (e.g., 10x daily rate or a fixed amount)
      const membership = await this.membershipService.findActiveMembership(
        loan.user.id,
      );
      const dailyFine =
        membership?.type?.fineRate || this.loanConfig.dailyFineAmount;
      
      // Set lost book fine to 10x the daily rate (or could be replaced with a config value)
      const lostBookFine = dailyFine * 10;

      // 3. Update loan status to LOST and store fine
      loan.status = LoanStatus.LOST;
      loan.fineAmount = lostBookFine;
      loan.returnedAt = new Date();
      loan.returnedBy = markedById;
      loan.notes = notes || 'Book marked as lost';

      const updatedLoan = await transactionalEntityManager.save(BookLoan, loan);

      // 4. Update book copy status to mark it as lost (set to unavailable state)
      const bookCopy = await transactionalEntityManager.findOne(BookCopy, {
        where: { id: loan.bookCopy.id },
      });

      if (bookCopy) {
        // Mark copy as lost
        bookCopy.status = BookCopyStatus.LOST;
        await transactionalEntityManager.save(BookCopy, bookCopy);
      }

      // 5. Clear cache
      await this.resetCache();

      this.logger.log(
        `Loan ${loanId} marked as LOST by user ${markedById} with fine amount ${lostBookFine}`,
      );

      return updatedLoan;
    });
  }

  /**
   * Gets active loans for a user with pagination support
   */
  async getUserLoansPaginated(
    userId: string,
    options: PaginationOptions = {},
  ): Promise<[BookLoan[], number]> {
    const page = options.page && options.page > 0 ? options.page : 1;
    const limit = options.limit && options.limit > 0 ? options.limit : 10;

    const [data, total] = await this.bookLoanRepository.findAndCount({
      where: {
        user: { id: userId },
        status: LoanStatus.ACTIVE,
      },
      relations: ['bookCopy', 'bookCopy.book'],
      order: { dueDate: 'ASC' },
      skip: (page - 1) * limit,
      take: limit,
    });

    return [data, total];
  }

  /**
   * Gets all overdue loans, optionally filtered by user
   */
  async getOverdueLoans(userId?: string): Promise<BookLoan[]> {
    const cacheKey = this.getOverdueLoansCacheKey(userId);

    // Check cache first
    const cachedData = await this.cacheManager.get<BookLoan[]>(cacheKey);
    if (cachedData) {
      return cachedData;
    }

    const where: any = {
      status: LoanStatus.ACTIVE,
      dueDate: LessThan(new Date()),
    };

    if (userId) {
      where.user = { id: userId };
    }

    const overdueLoans = await this.bookLoanRepository.find({
      where,
      relations: ['user', 'bookCopy', 'bookCopy.book'],
      order: { dueDate: 'ASC' },
    });

    // Cache the result for 60 seconds
    await this.cacheManager.set(cacheKey, overdueLoans, 60);
    return overdueLoans;
  }

  /**
   * Gets a loan by ID
   */
  /**
   * Find all book loans with optional filters and pagination
   * @param options Optional filters for status, userId, and bookId plus pagination
   */
  async findAll(
    options?: {
      status?: LoanStatus;
      userId?: string;
      bookId?: string;
    } & PaginationOptions,
  ): Promise<PaginatedResponseDto<BookLoan>> {
    const page = options?.page && options.page > 0 ? options.page : 1;
    const limit = options?.limit && options.limit > 0 ? options.limit : 10;

    const cacheKey = this.getLoansListCacheKey({
      status: options?.status,
      userId: options?.userId,
      bookId: options?.bookId,
      page,
      limit,
    });
    const cached =
      await this.cacheManager.get<PaginatedResponseDto<BookLoan>>(cacheKey);
    if (cached) {
      return cached;
    }

    const query = this.bookLoanRepository
      .createQueryBuilder('loan')
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

    query.orderBy('loan.borrowedAt', 'DESC');

    const [data, total] = await query
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();

    const totalPages = Math.ceil(total / limit);

    const response: PaginatedResponseDto<BookLoan> = {
      data,
      total,
      page,
      limit,
      totalPages,
      hasPreviousPage: page > 1,
      hasNextPage: page < totalPages,
    };

    await this.cacheManager.set(cacheKey, response, 60);
    return response;
  }

  /**
   * Gets a loan by ID
   */
  async getBookLoan(bookLoanId: string): Promise<BookLoan> {
    const cacheKey = this.getLoanDetailCacheKey(bookLoanId);

    // Check cache first
    const cachedData = await this.cacheManager.get<BookLoan>(cacheKey);
    if (cachedData) {
      return cachedData;
    }

    const loan = await this.bookLoanRepository.findOne({
      where: { id: bookLoanId },
      relations: ['user', 'bookCopy', 'bookCopy.book', 'request'],
    });

    if (!loan) {
      throw new NotFoundException(`Book loan with ID ${bookLoanId} not found`);
    }

    // Cache the result for 300 seconds (5 minutes)
    await this.cacheManager.set(cacheKey, loan, 300);
    return loan;
  }

  /**
   * Checks for overdue loans, updates their status, and sends notifications
   */
  async checkOverdueLoans(): Promise<{ updated: number; notified: number }> {
    const overdueLoans = await this.bookLoanRepository.find({
      where: {
        status: LoanStatus.ACTIVE,
        dueDate: LessThan(new Date()),
      },
      relations: ['user', 'bookCopy', 'bookCopy.book', 'user.memberships', 'user.memberships.type'],
    });

    let updated = 0;
    let notified = 0;

    for (const loan of overdueLoans) {
      try {
        // Calculate fine amount before marking overdue
        const fineAmount = await this.calculateFine(loan.id);

        // Update loan status to OVERDUE and store fine amount
        loan.status = LoanStatus.OVERDUE;
        loan.fineAmount = fineAmount;
        await this.bookLoanRepository.save(loan);
        updated++;

        // Send overdue notice in the background
        this.sendOverdueNotice(loan).catch((error) => {
          this.logger.error(
            `Failed to send overdue notice for loan ${loan.id}: ${error.message}`,
            error.stack,
          );
        });

        notified++;
        this.logger.log(
          `Marked loan ${loan.id} as overdue (fine: ${fineAmount}) and sent notice to user ${loan.user.id}`,
        );
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
    const membership = await this.membershipService.findActiveMembership(
      bookLoan.user.id,
    );

    // Get grace period from membership type configuration
    const gracePeriodDays = membership?.type?.gracePeriodDays ?? 0;
    const gracePeriodEnd = new Date(bookLoan.dueDate);
    gracePeriodEnd.setDate(gracePeriodEnd.getDate() + gracePeriodDays);

    if (now <= gracePeriodEnd) {
      return 0; // Within grace period
    }

    // Calculate days overdue (excluding grace period)
    const daysOverdue = Math.ceil(
      (now.getTime() - gracePeriodEnd.getTime()) / (1000 * 60 * 60 * 24),
    );

    // Apply membership-specific fine rate
    const dailyFine =
      membership?.type?.fineRate || this.loanConfig.dailyFineAmount;

    return Math.max(0, daysOverdue * dailyFine);
  }

  /**
   * Sends a loan renewal confirmation email (fire and forget)
   */
  private async sendRenewalConfirmation(
    loan: BookLoan,
    newDueDate: Date,
  ): Promise<void> {
    try {
      const { user, bookCopy } = loan;
      if (!user || !bookCopy?.book) {
        throw new Error(
          'Missing required loan data for sending renewal confirmation',
        );
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
        },
      );

      this.logger.log(
        `Sent renewal confirmation for loan ${loan.id} to ${user.email}`,
      );
    } catch (error) {
      this.logger.error(
        `Error in sendRenewalConfirmation for loan ${loan?.id}: ${error.message}`,
        error.stack,
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
        throw new Error(
          'Missing required loan data for sending return confirmation',
        );
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
        },
      );

      this.logger.log(
        `Sent return confirmation for loan ${loan.id} to ${user.email}`,
      );
    } catch (error) {
      this.logger.error(
        `Error in sendReturnConfirmation for loan ${loan?.id}: ${error.message}`,
        error.stack,
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
        throw new Error(
          'Missing required loan data for sending overdue notice',
        );
      }

      // Calculate days overdue
      const daysOverdue = Math.ceil(
        (new Date().getTime() - new Date(dueDate).getTime()) /
          (1000 * 60 * 60 * 24),
      );

      // Get membership for fine calculation
      const membership = await this.membershipService.findActiveMembership(
        user.id,
      );
      
      // Get grace period from membership type configuration
      const gracePeriodDays = membership?.type?.gracePeriodDays ?? 0;
      const gracePeriodEnd = new Date(dueDate);
      gracePeriodEnd.setDate(gracePeriodEnd.getDate() + gracePeriodDays);

      // Calculate fineAmount (may be 0 if within grace period)
      const dailyFine =
        membership?.type?.fineRate || this.loanConfig.dailyFineAmount;
      const daysOverdueExcludingGrace = Math.max(
        0,
        Math.ceil(
          (new Date().getTime() - gracePeriodEnd.getTime()) /
            (1000 * 60 * 60 * 24),
        ),
      );
      const fineAmount = daysOverdueExcludingGrace * dailyFine;

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
        },
      );

      this.logger.log(
        `Sent overdue notice for loan ${loan.id} to ${user.email}`,
      );
    } catch (error) {
      this.logger.error(
        `Error in sendOverdueNotice for loan ${loan?.id}: ${error.message}`,
        error.stack,
      );
      throw error; // Re-throw to be caught by the caller
    }
  }
}
