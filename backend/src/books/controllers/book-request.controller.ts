import { Controller, Get, Post, Delete, Param, Body, UseGuards, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { BookRequestService } from '../services/book-request.service';
import { User } from '../../users/entities/user.entity';
import { BookRequest } from '../entities/book-request.entity';
import { GetUser } from 'src/auth/decorators/get-user.decorator';
import { Public } from 'src/auth/decorators/public.decorator';

@ApiTags('Book Requests')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('book-requests')
export class BookRequestController {
  constructor(private readonly bookRequestService: BookRequestService) {}

  @Post(':bookId')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Request a book that is not available' })
  @ApiParam({ name: 'bookId', description: 'ID of the book to request' })
  @ApiResponse({ status: HttpStatus.CREATED, description: 'Book request created successfully' })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: 'Book is available or already requested' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Book not found' })
  async requestBook(
    @Param('bookId') bookId: number,
    @GetUser() user: User,
  ): Promise<{ request: BookRequest; position: number }> {
    const request = await this.bookRequestService.requestBook(user.id, bookId);
    return {
      request,
      position: request.position,
    };
  }

  @Delete(':requestId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Cancel a book request' })
  @ApiParam({ name: 'requestId', description: 'ID of the book request to cancel' })
  @ApiResponse({ status: HttpStatus.NO_CONTENT, description: 'Request cancelled successfully' })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: 'Cannot cancel request' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Request not found' })
  async cancelRequest(
    @Param('requestId') requestId: number,
    @GetUser() user: User,
  ): Promise<void> {
    await this.bookRequestService.cancelRequest(user.id, requestId);
  }

  @Public()
  @Get('book/:bookId/queue')
  @ApiOperation({ summary: 'Get the queue for a specific book' })
  @ApiParam({ name: 'bookId', description: 'ID of the book' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Returns the queue for the book' })
  async getBookQueue(@Param('bookId') bookId: number): Promise<BookRequest[]> {
    return this.bookRequestService.getBookQueue(bookId);
  }

  @Get('my-requests')
  @Public()
  @ApiOperation({ summary: 'Get all requests for the current user' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Returns all requests for the user' })
  async getUserRequests(@GetUser() user: User): Promise<BookRequest[]> {
    return this.bookRequestService.getUserRequests(user.id);
  }
}
