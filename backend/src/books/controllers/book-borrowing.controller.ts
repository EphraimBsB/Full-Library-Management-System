import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { 
  ApiTags, 
  ApiOperation, 
  ApiResponse, 
  ApiParam, 
  ApiQuery 
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { BookBorrowingService } from '../services/book-borrowing.service';
import { Public } from '../../auth/decorators/public.decorator';
import { PaginationDto } from 'src/common/dto/pagination.dto';

@ApiTags('book-borrowing')
@Controller('api/books/borrow')
@UseGuards(JwtAuthGuard)
export class BookBorrowingController {
  /**
   * Creates a new instance of the BookBorrowingController
   * @param bookBorrowingService The book borrowing service
   */
  constructor(
    private readonly bookBorrowingService: BookBorrowingService,
  ) {}

  /**
   * Get borrowing status for a specific book
   * @param bookId ID of the book
   * @param pagination Pagination parameters
   * @returns Paginated list of current borrowings for the book
   */

  @Get('book/:bookId/status')
  @Public()
  @ApiOperation({ summary: 'Get borrowing status for a specific book' })
  @ApiResponse({ status: 200, description: 'Borrowing status of the book' })
  @ApiParam({ name: 'bookId', required: true, type: String, description: 'ID of the book' })
  @ApiQuery({ name: 'page', required: false, type: Number, description: 'Page number' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Items per page' })
  async getBookBorrowingStatus(
    @Param('bookId') bookId: string,
    @Query() pagination: PaginationDto,
  ) {
    return this.bookBorrowingService.getBookBorrowingStatus(
      bookId,
      pagination.page || 1,
      pagination.limit || 10
    );
  }

  /**
   * Get borrowing history for a specific book
   * @param bookId ID of the book
   * @param pagination Pagination parameters
   * @returns Paginated list of past borrowings for the book
   */
  @Get('book/:bookId/history')
  @Public()
  @ApiOperation({ summary: 'Get borrowing history for a specific book' })
  @ApiResponse({ status: 200, description: 'Borrowing history of the book' })
  @ApiParam({ name: 'bookId', required: true, type: String, description: 'ID of the book' })
  @ApiQuery({ name: 'page', required: false, type: Number, description: 'Page number' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Items per page' })
  async getBookBorrowingHistory(
    @Param('bookId') bookId: string,
    @Query() pagination: PaginationDto,
  ) {
    return this.bookBorrowingService.getBookBorrowingHistory(
      bookId,
      pagination.page || 1,
      pagination.limit || 10
    );
  }

  /**
   * Get borrowing statistics for a specific book
   * @param bookId ID of the book
   * @returns Statistics about the book's borrowing history
   */
  @Get('book/:bookId/stats')
  @Public()
  @ApiOperation({ summary: 'Get borrowing statistics for a specific book' })
  @ApiResponse({ status: 200, description: 'Borrowing statistics for the book' })
  @ApiParam({ name: 'bookId', required: true, type: String, description: 'ID of the book' })
  async getBookBorrowingStats(
    @Param('bookId') bookId: string,
  ) {
    return this.bookBorrowingService.getBookBorrowingStats(bookId);
  }

}
