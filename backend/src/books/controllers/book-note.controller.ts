import { 
  Controller, 
  Get, 
  Post, 
  Body, 
  Param, 
  Delete, 
  Put, 
  UseGuards, 
  Query, 
  ParseIntPipe,
  Request,
  NotFoundException
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { BookNoteService } from '../services/book-note.service';
import { CreateBookNoteDto, UpdateBookNoteDto, BookNoteResponseDto } from '../dto/book-note.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';

@ApiTags('books')
@Controller('books/notes')
@ApiBearerAuth()
export class BookNoteController {
  constructor(private readonly bookNoteService: BookNoteService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Create a new book note' })
  @ApiResponse({ status: 201, description: 'The note has been successfully created.', type: BookNoteResponseDto })
  @ApiResponse({ status: 404, description: 'Book not found.' })
  async create(
    @Request() req,
    @Body() createBookNoteDto: CreateBookNoteDto,
  ): Promise<BookNoteResponseDto> {
    return this.bookNoteService.createNote(req.user.id, createBookNoteDto.bookId, createBookNoteDto);
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Get all notes for the authenticated user' })
  @ApiQuery({ name: 'bookId', required: false, type: Number })
  @ApiResponse({ status: 200, description: 'Returns all notes for the user.', type: [BookNoteResponseDto] })
  async getUserNotes(
    @Request() req,
    @Query('bookId') bookId?: number,
  ): Promise<BookNoteResponseDto[]> {
    return this.bookNoteService.getUserNotes(req.user.id, bookId);
  }

  @Get('book/:bookId')
  @ApiOperation({ summary: 'Get public notes for a book' })
  @ApiResponse({ status: 200, description: 'Returns public notes for the book.', type: [BookNoteResponseDto] })
  async getBookNotes(
    @Param('bookId', ParseIntPipe) bookId: number,
    @Request() req,
  ): Promise<BookNoteResponseDto[]> {
    const userId = req.user?.id;
    return this.bookNoteService.getBookNotes(bookId, userId);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Get a specific note by ID' })
  @ApiResponse({ status: 200, description: 'Returns the requested note.', type: BookNoteResponseDto })
  @ApiResponse({ status: 403, description: 'Forbidden - Note is private.' })
  @ApiResponse({ status: 404, description: 'Note not found.' })
  async findOne(
    @Param('id') id: string,
    @Request() req,
  ): Promise<BookNoteResponseDto> {
    return this.bookNoteService.getNoteById(id, req.user.id);
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Update a note' })
  @ApiResponse({ status: 200, description: 'The note has been successfully updated.', type: BookNoteResponseDto })
  @ApiResponse({ status: 403, description: 'Forbidden - User does not own this note.' })
  @ApiResponse({ status: 404, description: 'Note not found.' })
  async update(
    @Param('id') id: string,
    @Body() updateBookNoteDto: UpdateBookNoteDto,
    @Request() req,
  ): Promise<BookNoteResponseDto> {
    return this.bookNoteService.updateNote(req.user.id, id, updateBookNoteDto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Delete a note' })
  @ApiResponse({ status: 200, description: 'The note has been successfully deleted.' })
  @ApiResponse({ status: 403, description: 'Forbidden - User does not own this note.' })
  @ApiResponse({ status: 404, description: 'Note not found.' })
  async remove(
    @Param('id') id: string,
    @Request() req,
  ): Promise<void> {
    return this.bookNoteService.deleteNote(req.user.id, id);
  }
}
