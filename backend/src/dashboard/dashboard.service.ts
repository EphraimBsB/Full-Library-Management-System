import { Inject, Injectable } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import * as cacheManager from 'cache-manager';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull, In } from 'typeorm';
import { Book } from '../books/entities/book.entity';
import { User } from '../users/entities/user.entity';
import { DashboardStatsDto } from './dto/dashboard-stats.dto';
import { BookLoan, LoanStatus } from '../books/entities/book-loan.entity';
import { BookRequest, BookRequestStatus } from '../books/entities/book-request.entity';

export interface DashboardSummary {
  stats: DashboardStatsDto;
  recentBooks: Book[];
  topRatedBooks: Book[];
  mostBorrowedBooks: Book[];
  pendingRequests: BookRequest[];
  recentOverdues: BookLoan[];
  activeUsers: User[];
}

@Injectable()
export class DashboardService {
  constructor(
    @InjectRepository(Book) private readonly bookRepository: Repository<Book>,
    @InjectRepository(User) private readonly userRepository: Repository<User>,
    @InjectRepository(BookRequest) private readonly requestRepository: Repository<BookRequest>,
    @InjectRepository(BookLoan) private readonly loanRepository: Repository<BookLoan>,
    @Inject(CACHE_MANAGER) private cacheManager: cacheManager.Cache,
  ) {}

  async getDashboardSummary(): Promise<DashboardSummary> {
    // Try cache first
    const cached = await this.cacheManager.get<DashboardSummary>('dashboard_summary');
    if (cached) return cached;

    // Fetch all data concurrently
    const [stats, recentBooks, topRatedBooks, mostBorrowedBooks, pendingRequests, recentOverdues, activeUsers] =
      await Promise.all([
        this.getStats(),
        this.getRecentlyAdded(10),
        this.getTopRated(10),
        this.getMostBorrowed(10),
        this.getPending(5),
        this.getRecentOverdues(5),
        this.getMostActive(5),
      ]);

    const result = {
      stats,
      recentBooks,
      topRatedBooks,
      mostBorrowedBooks,
      pendingRequests,
      recentOverdues,
      activeUsers,
    };

    // Cache for 5 minutes
    await this.cacheManager.set('dashboard_summary', result, 5 * 60 * 1000);
    return result;
  }

  private async getStats(): Promise<DashboardStatsDto> {
    const [books, users] = await Promise.all([
      this.bookRepository.count({ where: { deletedAt: IsNull() } }),
      this.userRepository.count(),
    ]);

    // Count active and overdue loans through book copies
    const [activeLoans, overdueLoans] = await Promise.all([
      this.loanRepository
        .createQueryBuilder('loan')
        .innerJoin('loan.bookCopy', 'copy')
        .innerJoin('copy.book', 'book')
        .where('loan.status = :status', { status: LoanStatus.ACTIVE })
        .andWhere('book.deletedAt IS NULL')
        .getCount(),
      
      this.loanRepository
        .createQueryBuilder('loan')
        .innerJoin('loan.bookCopy', 'copy')
        .innerJoin('copy.book', 'book')
        .where('loan.status = :status', { status: LoanStatus.OVERDUE })
        .andWhere('book.deletedAt IS NULL')
        .getCount()
    ]);

    return {
      books,
      users,
      loans: activeLoans,
      overdue: overdueLoans,
    };
  }

  private async getRecentlyAdded(limit = 10): Promise<Book[]> {
    return this.bookRepository.find({
      where: { deletedAt: IsNull() },
      order: { createdAt: 'DESC' },
      take: limit,
      relations: ['categories', 'subjects', 'copies', 'type'],
    });
  }

  private async getTopRated(limit = 10): Promise<Book[]> {
    return this.bookRepository.find({
      where: { deletedAt: IsNull() },
      order: { metadata: { averageRating: 'DESC' } },
      take: limit,
      relations: ['categories', 'subjects', 'copies', 'type', 'metadata'],
    });
  }

  private async getMostBorrowed(limit = 10): Promise<Book[]> {
    // First, get the book IDs with their loan counts
    const bookLoanCounts = await this.bookRepository
      .createQueryBuilder('book')
      .leftJoin('book.copies', 'copy')
      .leftJoin('copy.loans', 'loan')
      .select('book.id', 'id')
      .addSelect('COUNT(loan.id)', 'loanCount')
      .where('book.deletedAt IS NULL')
      .groupBy('book.id')
      .orderBy('loanCount', 'DESC')
      .limit(limit)
      .getRawMany();

    if (bookLoanCounts.length === 0) {
      return [];
    }

    // Then fetch the complete book data for these IDs
    const bookIds = bookLoanCounts.map(item => item.id);
    const books = await this.bookRepository.find({
      where: { id: In(bookIds) },
      relations: ['categories', 'subjects', 'copies', 'type'],
    });

    // Sort the books to maintain the same order as in bookLoanCounts
    const bookMap = new Map(books.map(book => [book.id, book]));
    return bookIds
      .map(id => bookMap.get(id))
      .filter((book): book is Book => book !== undefined);
  }

  private async getPending(limit = 5): Promise<BookRequest[]> {
    return this.requestRepository.find({
      where: { status: BookRequestStatus.PENDING },
      order: { createdAt: 'DESC' },
      take: limit,
      relations: ['user', 'book'],
    });
  }

  private async getRecentOverdues(limit = 5): Promise<BookLoan[]> {
    return this.loanRepository.find({
      where: { status: LoanStatus.OVERDUE },
      order: { dueDate: 'DESC' },
      take: limit,
      relations: ['bookCopy', 'user', 'bookCopy.book'],
    });
  }

  private async getMostActive(limit = 5): Promise<User[]> {
    return this.userRepository
      .createQueryBuilder('user')
      .leftJoin('user.bookLoans', 'loan')
      .groupBy('user.id')
      .addGroupBy('user.firstName')
      .addGroupBy('user.lastName')
      .orderBy('COUNT(loan.id)', 'DESC')
      .limit(limit)
      .getMany();
  }
}
