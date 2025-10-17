import { 
  Controller, 
  Get, 
  Post, 
  Body, 
  Param, 
  UseGuards, 
  Request, 
  Query, 
  ParseIntPipe,
  BadRequestException
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { BookFavoriteService } from '../services/book-favorite.service';
import { BookFavoriteResponseDto, ToggleBookFavoriteDto } from '../dto/book-favorite.dto';
import { Book } from '../entities/book.entity';

@ApiTags('books')
@Controller('books/favorites')
@ApiBearerAuth()
export class BookFavoriteController {
  constructor(private readonly bookFavoriteService: BookFavoriteService) {}

  @Post('toggle')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Toggle favorite status for a book' })
  @ApiResponse({ 
    status: 201, 
    description: 'The favorite status has been toggled.',
    schema: {
      type: 'object',
      properties: {
        isFavorite: { type: 'boolean' }
      }
    }
  })
  @ApiResponse({ status: 404, description: 'Book not found.' })
  async toggleFavorite(
    @Request() req,
    @Body() toggleDto: ToggleBookFavoriteDto,
  ): Promise<{ isFavorite: boolean }> {
    return this.bookFavoriteService.toggleFavorite(req.user.id, toggleDto);
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Get all favorite books for the authenticated user' })
  @ApiResponse({ 
    status: 200, 
    description: 'Returns all favorite books for the user.',
    type: [Book]
  })
  async getUserFavorites(
    @Request() req,
  ): Promise<Book[]> {
    return this.bookFavoriteService.getUserFavorites(req.user.id);
  }

  @Get('check/:bookId')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Check if a book is in user\'s favorites' })
  @ApiResponse({ 
    status: 200, 
    description: 'Returns whether the book is in favorites.',
    schema: {
      type: 'object',
      properties: {
        isFavorite: { type: 'boolean' }
      }
    }
  })
  async checkFavorite(
    @Param('bookId', ParseIntPipe) bookId: number,
    @Request() req,
  ): Promise<{ isFavorite: boolean }> {
    const isFavorite = await this.bookFavoriteService.isBookFavorite(req.user.id, bookId);
    return { isFavorite };
  }

  @Get('popular')
  @ApiOperation({ summary: 'Get most popular books by favorites' })
  @ApiQuery({ 
    name: 'limit', 
    required: false, 
    type: Number,
    description: 'Number of popular books to return (default: 10)'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Returns most popular books by favorites.',
    type: [BookFavoriteResponseDto]
  })
  async getPopularBooks(
    @Query('limit', new ParseIntPipe({ optional: true })) limit = 10,
  ) {
    if (limit < 1 || limit > 100) {
      throw new BadRequestException('Limit must be between 1 and 100');
    }
    return this.bookFavoriteService.getPopularBooks(limit);
  }

  @Get('count/:bookId')
  @ApiOperation({ summary: 'Get number of favorites for a book' })
  @ApiResponse({ 
    status: 200, 
    description: 'Returns the number of favorites for the book.',
    schema: {
      type: 'object',
      properties: {
        count: { type: 'number' }
      }
    }
  })
  async getFavoritesCount(
    @Param('bookId', ParseIntPipe) bookId: number,
  ): Promise<{ count: number }> {
    const count = await this.bookFavoriteService.getFavoritesCount(bookId);
    return { count };
  }
}
