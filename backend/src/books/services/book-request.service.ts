import { Injectable, NotFoundException, BadRequestException, Inject, forwardRef } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource, IsNull, Not } from 'typeorm';
import { Book } from '../entities/book.entity';
import { User } from '../../users/entities/user.entity';
import { BookRequest, RequestStatus } from '../entities/book-request.entity';
import { BookBorrowingService } from './book-borrowing.service';
import { AccessNumber } from '../entities/access-number.entity';
import { NotificationsService } from '../../notifications/notifications.service';
import { NotificationType } from '../../notifications/entities/notification.entity';
import { EmailService } from '../../notifications/email.service';

@Injectable()
export class BookRequestService {
  constructor(
    @InjectRepository(BookRequest)
    private readonly bookRequestRepository: Repository<BookRequest>,
    @InjectRepository(Book)
    private readonly bookRepository: Repository<Book>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(AccessNumber)
    private readonly accessNumberRepository: Repository<AccessNumber>,
    @Inject(forwardRef(() => BookBorrowingService))
    private readonly bookBorrowingService: BookBorrowingService,
    private dataSource: DataSource,
    private readonly notifications: NotificationsService,
    private readonly email: EmailService,
  ) {}

  /**
   * Request a book that is currently not available
   */
  async requestBook(userId: string, bookId: number): Promise<BookRequest> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // 1. Check if book exists
      const book = await queryRunner.manager.findOne(Book, {
        where: { id: bookId },
        relations: ['accessNumbers'],
      });

      if (!book) {
        throw new NotFoundException('Book not found');
      }

      // 2. Check if user exists
      const user = await queryRunner.manager.findOne(User, {
        where: { id: userId },
      });

      if (!user) {
        throw new NotFoundException('User not found');
      }

      // 3. Check if book is actually available
      if (book.availableCopies > 0) {
        throw new BadRequestException('This book is currently available for immediate borrowing');
      }

      // 4. Check if user already has an active request for this book
      const existingRequest = await queryRunner.manager.findOne(BookRequest, {
        where: {
          userId,
          bookId,
          status: RequestStatus.PENDING,
        },
      });

      if (existingRequest) {
        throw new BadRequestException('You already have a pending request for this book');
      }

      // 5. Create the book request
      const bookRequest = this.bookRequestRepository.create({
        userId,
        user,
        bookId,
        book,
        status: RequestStatus.PENDING,
      });

      await queryRunner.manager.save(bookRequest);
      await queryRunner.commitTransaction();

      // 6. Calculate and set the position in queue
      bookRequest.position = await this.calculateQueuePosition(bookRequest.id, bookId);
      
      return bookRequest;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  /**
   * Cancel a book request
   */
  async cancelRequest(userId: string, requestId: number): Promise<void> {
    const request = await this.bookRequestRepository.findOne({
      where: { id: requestId, userId },
    });

    if (!request) {
      throw new NotFoundException('Request not found or you do not have permission to cancel it');
    }

    if (request.status !== RequestStatus.PENDING) {
      throw new BadRequestException('Only pending requests can be cancelled');
    }

    request.status = RequestStatus.CANCELLED;
    await this.bookRequestRepository.save(request);

    // Notify user about cancellation
    await this.notifyUser(userId, {
      title: 'Request Cancelled',
      message: `Your request for book ID ${request.bookId} has been cancelled.`,
      bookId: request.bookId,
      requestId: request.id,
    });
  }

  /**
   * Get all pending requests for a book
   */
  async getBookQueue(bookId: number): Promise<BookRequest[]> {
    const requests = await this.bookRequestRepository.find({
      where: { 
        bookId, 
        status: RequestStatus.PENDING,
      },
      relations: ['user'],
      order: { createdAt: 'ASC' },
    });

    // Add position in queue
    return requests.map((request, index) => ({
      ...request,
      position: index + 1,
    }));
  }

  /**
   * Get all requests for a user
   */
  async getUserRequests(userId: string): Promise<BookRequest[]> {
    const requests = await this.bookRequestRepository.find({
      where: { userId },
      relations: ['book'],
      order: { createdAt: 'DESC' },
    });

    // Add position in queue for pending requests
    return Promise.all(requests.map(async (request) => {
      if (request.status === RequestStatus.PENDING) {
        const position = await this.calculateQueuePosition(request.id, request.bookId);
        return { ...request, position };
      }
      return request;
    }));
  }

  /**
   * Mark a user's pending request as fulfilled
   */
  async markRequestAsFulfilled(userId: string, bookId: number): Promise<void> {
    const request = await this.bookRequestRepository.findOne({
      where: {
        userId,
        bookId,
        status: RequestStatus.PENDING,
      },
    });

    if (request) {
      request.status = RequestStatus.FULFILLED;
      request.fulfilledAt = new Date();
      await this.bookRequestRepository.save(request);

      // Notify user about fulfillment
      await this.notifyUser(request.userId, {
        title: 'Request Fulfilled',
        message: `Your request for book ID ${request.bookId} is fulfilled and ready to borrow.`,
        bookId: request.bookId,
        requestId: request.id,
      });
    }
  }

  /**
   * Process book returns and notify next in queue
   */
  async processBookReturn(bookId: number): Promise<void> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // 1. Find the next pending request for this book
      const nextRequest = await queryRunner.manager.findOne(BookRequest, {
        where: { 
          bookId, 
          status: RequestStatus.PENDING,
        },
        relations: ['user', 'book'],
        order: { createdAt: 'ASC' },
      });

      if (!nextRequest) {
        // No pending requests for this book
        return;
      }

      // 2. Find an available copy of the book
      const availableCopy = await queryRunner.manager.findOne(AccessNumber, {
        where: { 
          bookId,
          // Find a copy that's not currently borrowed
          borrowedBooks: {
            returnedAt: IsNull(),
          },
        },
        relations: ['borrowedBooks'],
      });

      if (!availableCopy) {
        throw new Error('No available copies found despite book being marked as available');
      }

      // 3. Update the request status
      nextRequest.status = RequestStatus.FULFILLED;
      nextRequest.fulfilledAt = new Date();
      await queryRunner.manager.save(nextRequest);

      // 4. Notify the user
      await this.notifyUser(nextRequest.userId, {
        title: 'Book Available',
        message: `The book "${nextRequest.book.title}" is now available for you to borrow.`,
        bookId: nextRequest.bookId,
        requestId: nextRequest.id,
      });
    } finally {
      await queryRunner.release();
    }
  }

  /**
   * Calculate the position of a request in the queue
   */
  private async calculateQueuePosition(requestId: number, bookId: number): Promise<number> {
    return this.bookRequestRepository
      .createQueryBuilder('request')
      .where('request.bookId = :bookId', { bookId })
      .andWhere('request.status = :status', { status: RequestStatus.PENDING })
      .andWhere('request.id <= :requestId', { requestId })
      .getCount();
  }

  /**
   * Get all pending book requests with pagination
   */
  async getPendingRequests(page: number = 1, limit: number = 10) {
    const [items, total] = await this.bookRequestRepository.findAndCount({
      where: {
        status: RequestStatus.PENDING,
      },
      relations: ['book', 'user'],
      order: {
        createdAt: 'ASC', // Oldest first
      },
      skip: (page - 1) * limit,
      take: limit,
    });

    return {
      items,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * Notify user (placeholder - implement based on your notification system)
   */
  private async notifyUser(userId: string, data: { title: string; message: string; bookId?: number; requestId?: number }) {
    // In-app notification
    await this.notifications.create({
      userId,
      title: data.title,
      message: data.message,
      type: NotificationType.BOOK_REQUEST_STATUS,
      data: { bookId: data.bookId, requestId: data.requestId },
    });

    // Email (if enabled)
    if (this.email.isEnabled) {
      await this.email.sendToUser(
        userId,
        data.title,
        `${data.message}${data.bookId ? ` (Book ID: ${data.bookId})` : ''}`,
      );
    }
  }
}
