import { Injectable, Inject } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull, LessThan } from 'typeorm';
import { Book } from '../entities/book.entity';
import { BorrowedBook, BorrowedBookStatus } from '../entities/borrowed-book.entity';
import { AccessNumber } from '../entities/access-number.entity';
import { PaginatedResponse, createPaginatedResponse } from 'src/common/interfaces/paginated-response.interface';

/**
 * Interface for book borrowing statistics
 */
export interface BookBorrowingStats {
  totalBorrowed: number;
  currentlyBorrowed: number;
  overdueCount: number;
  available: number;
  recentBorrowings: BorrowedBook[];
}

@Injectable()
export class BookBorrowingService {
  constructor(
    @InjectRepository(Book)
    private readonly bookRepository: Repository<Book>,
    @InjectRepository(BorrowedBook)
    private readonly borrowedBookRepository: Repository<BorrowedBook>,
    @InjectRepository(AccessNumber)
    private readonly accessNumberRepository: Repository<AccessNumber>,
  ) {}

  /**
   * Get count of available copies of a book
   * @param bookId ID of the book
   * @private
   */

  /**
   * Get borrowing status for a specific book
   * @param bookId ID of the book
   * @param page Page number (1-based)
   * @param limit Items per page
   * @returns Paginated list of current borrowings for the book
   */
  async getBookBorrowingStatus(
    bookId: string,
    page: number = 1,
    limit: number = 10,
  ): Promise<PaginatedResponse<BorrowedBook>> {
    const numericBookId = parseInt(bookId, 10);
    
    const [items, total] = await this.borrowedBookRepository.findAndCount({
      where: {
        bookId: numericBookId,
        status: BorrowedBookStatus.BORROWED,
      },
      relations: ['user', 'book', 'accessNumber'],
      order: { borrowedAt: 'ASC' },
      skip: (page - 1) * limit,
      take: limit,
    });

    return createPaginatedResponse(items, total, page, limit);
  }

  /**
   * Get borrowing history for a specific book
   * @param bookId ID of the book
   * @param page Page number (1-based)
   * @param limit Items per page
   * @returns Paginated list of past borrowings for the book
   */
  async getBookBorrowingHistory(
    bookId: string,
    page: number = 1,
    limit: number = 10,
  ): Promise<PaginatedResponse<BorrowedBook>> {
    const numericBookId = parseInt(bookId, 10);
    
    const [items, total] = await this.borrowedBookRepository.findAndCount({
      where: {
        bookId: numericBookId,
        status: BorrowedBookStatus.RETURNED,
      },
      relations: ['user', 'book', 'accessNumber'],
      order: { returnedAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });

    return createPaginatedResponse(items, total, page, limit);
  }

  /**
   * Get borrowing statistics for a specific book
   * @param bookId ID of the book
   * @returns Statistics about the book's borrowing history
   */
  async getBookBorrowingStats(bookId: string): Promise<BookBorrowingStats> {
    const numericBookId = parseInt(bookId, 10);
    
    const [totalBorrowed, currentlyBorrowed, overdueCount, recentBorrowings] = await Promise.all([
      // Total borrowings count
      this.borrowedBookRepository.count({
        where: { bookId: numericBookId },
      }),
      
      // Currently borrowed count
      this.borrowedBookRepository.count({
        where: {
          bookId: numericBookId,
          status: BorrowedBookStatus.BORROWED,
        },
      }),
      
      // Overdue count
      this.borrowedBookRepository.count({
        where: {
          bookId: numericBookId,
          status: BorrowedBookStatus.BORROWED,
          dueDate: LessThan(new Date()),
        },
      }),
      
      // Recent borrowings (last 5)
      this.borrowedBookRepository.find({
        where: { bookId: numericBookId },
        order: { borrowedAt: 'DESC' as const },
        take: 5,
        relations: ['user', 'book'],
      }),
    ]);

    const available = await this.getAvailableCopiesCount(bookId);

    return {
      totalBorrowed,
      currentlyBorrowed,
      overdueCount,
      available,
      recentBorrowings,
    };
  }

  /**
   * Get count of available copies of a book
   * @param bookId ID of the book
   * @returns Number of available copies
   */
  private async getAvailableCopiesCount(bookId: string): Promise<number> {
    const numericBookId = parseInt(bookId, 10);
    
    const [totalCopies, borrowedCopies] = await Promise.all([
      // Total copies count
      this.accessNumberRepository.count({
        where: { bookId: numericBookId },
      }),
      
      // Currently borrowed copies count
      this.borrowedBookRepository.count({
        where: {
          bookId: numericBookId,
          status: BorrowedBookStatus.BORROWED,
        },
      }),
    ]);

    return Math.max(0, totalCopies - borrowedCopies);
  }
}
