import { 
  Controller, 
  Get, 
  Post, 
  Body, 
  Param, 
  Patch, 
  Delete, 
  Query, 
  ParseIntPipe, 
  DefaultValuePipe,
  HttpStatus,
  HttpCode,
  UseInterceptors,
  ClassSerializerInterceptor
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiBody, ApiQuery } from '@nestjs/swagger';
import { Public } from '../auth/decorators/public.decorator';
import { BooksService } from './books.service';
import { CreateBookDto } from './dto/create-book.dto';
import { UpdateBookDto } from './dto/update-book.dto';
import { BookQueryDto } from './dto/book-query.dto';
import { Book } from './entities/book.entity';
import { PaginatedResponseDto } from '../common/dto/paginated-response.dto';
import { BatchCreateBooksDto, BatchUpdateBooksDto } from './dto/batch-book.dto';

@ApiTags('books')
@Controller('books')
@UseInterceptors(ClassSerializerInterceptor)
export class BooksController {
  constructor(private readonly booksService: BooksService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a new book' })
  @ApiBody({ type: CreateBookDto })
  @ApiResponse({ status: HttpStatus.CREATED, description: 'The book has been successfully created.', type: Book })
  @ApiResponse({ status: HttpStatus.CONFLICT, description: 'A book with this ISBN already exists.' })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: 'Invalid input data.' })
  async create(@Body() createBookDto: CreateBookDto): Promise<Book> {
    return this.booksService.create(createBookDto);
  }

  @Post('batch')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create multiple books in a batch' })
  @ApiBody({ type: BatchCreateBooksDto })
  @ApiResponse({ 
    status: HttpStatus.CREATED, 
    description: 'The books have been successfully created.', 
    type: [Book] 
  })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: 'Invalid input data.' })
  async createMany(@Body() batchCreateBooksDto: BatchCreateBooksDto): Promise<Book[]> {
    return this.booksService.createMany(batchCreateBooksDto);
  }

  @Get()
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get all books with optional filtering and pagination' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Returns a paginated list of books.', type: PaginatedResponseDto })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'search', required: false, type: String })
  @ApiQuery({ name: 'author', required: false, type: String })
  @ApiQuery({ name: 'title', required: false, type: String })
  @ApiQuery({ name: 'isbn', required: false, type: String })
  @ApiQuery({ name: 'minYear', required: false, type: Number })
  @ApiQuery({ name: 'maxYear', required: false, type: Number })
  @ApiQuery({ name: 'categories', required: false, type: [String] })
  @ApiQuery({ name: 'type', required: false, enum: ['physical', 'ebook', 'audiobook', 'reference', 'periodical'] })
  @ApiQuery({ name: 'minAvailable', required: false, type: Number })
  @ApiQuery({ name: 'sortBy', required: false, type: String })
  @ApiQuery({ name: 'sortOrder', required: false, enum: ['ASC', 'DESC'] })
  async findAll(
    @Query() query: BookQueryDto
  ): Promise<{ data: Book[]; total: number }> {
    return this.booksService.findAll(query);
  }

  @Get(':id')
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get a book by ID' })
  @ApiParam({ name: 'id', description: 'Book ID' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Returns the book with the specified ID.', type: Book })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Book not found.' })
  async findOne(@Param('id', ParseIntPipe) id: number): Promise<Book> {
    return this.booksService.findOne(id);
  }

  @Patch('batch')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Update multiple books in a batch' })
  @ApiBody({ type: BatchUpdateBooksDto })
  @ApiResponse({ 
    status: HttpStatus.OK, 
    description: 'The books have been successfully updated.', 
    type: [Book] 
  })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'One or more books not found.' })
  @ApiResponse({ status: HttpStatus.CONFLICT, description: 'A book with this ISBN already exists.' })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: 'Invalid input data.' })
  async updateMany(@Body() batchUpdateBooksDto: BatchUpdateBooksDto): Promise<Book[]> {
    return this.booksService.updateMany(batchUpdateBooksDto);
  }

  @Patch(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Update a book' })
  @ApiParam({ name: 'id', description: 'Book ID' })
  @ApiBody({ type: UpdateBookDto })
  @ApiResponse({ status: HttpStatus.OK, description: 'The book has been successfully updated.', type: Book })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Book not found.' })
  @ApiResponse({ status: HttpStatus.CONFLICT, description: 'A book with this ISBN already exists.' })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: 'Invalid input data.' })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateBookDto: UpdateBookDto,
  ): Promise<Book> {
    return this.booksService.update(id, updateBookDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a book (soft delete)' })
  @ApiParam({ name: 'id', description: 'Book ID' })
  @ApiResponse({ status: HttpStatus.NO_CONTENT, description: 'The book has been successfully deleted.' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Book not found.' })
  async remove(@Param('id', ParseIntPipe) id: number): Promise<void> {
    return this.booksService.remove(id);
  }

  // @Post(':id/checkout')
  // @HttpCode(HttpStatus.OK)
  // @ApiOperation({ summary: 'Check out a book' })
  // @ApiParam({ name: 'id', description: 'Book ID' })
  // @ApiQuery({ name: 'quantity', required: false, type: Number, description: 'Number of copies to check out (default: 1)' })
  // @ApiResponse({ status: HttpStatus.OK, description: 'The book has been checked out successfully.', type: Book })
  // @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Book not found.' })
  // @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: 'Not enough copies available or invalid quantity.' })
  // async checkOutBook(
  //   @Param('id', ParseIntPipe) id: number,
  //   @Query('quantity', new DefaultValuePipe(1), ParseIntPipe) quantity: number,
  // ): Promise<Book> {
  //   return this.booksService.checkOutBook(id, quantity);
  // }

  // @Post(':id/return')
  // @HttpCode(HttpStatus.OK)
  // @ApiOperation({ summary: 'Return a checked out book' })
  // @ApiParam({ name: 'id', description: 'Book ID' })
  // @ApiQuery({ name: 'quantity', required: false, type: Number, description: 'Number of copies to return (default: 1)' })
  // @ApiResponse({ status: HttpStatus.OK, description: 'The book has been returned successfully.', type: Book })
  // @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Book not found.' })
  // @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: 'Invalid quantity or more copies returned than checked out.' })
  // async returnBook(
  //   @Param('id', ParseIntPipe) id: number,
  //   @Query('quantity', new DefaultValuePipe(1), ParseIntPipe) quantity: number,
  // ): Promise<Book> {
  //   return this.booksService.returnBook(id, quantity);
  // }
}
