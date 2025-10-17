import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BookNote } from '../entities/book-note.entity';
import { Book } from '../entities/book.entity';
import { CreateBookNoteDto, UpdateBookNoteDto, BookNoteResponseDto } from '../dto/book-note.dto';

@Injectable()
export class BookNoteService {
  constructor(
    @InjectRepository(BookNote)
    private readonly bookNoteRepository: Repository<BookNote>,
    @InjectRepository(Book)
    private readonly bookRepository: Repository<Book>,
  ) {}

  async createNote(userId: string, bookId: number, createDto: CreateBookNoteDto): Promise<BookNoteResponseDto> {
    // Check if book exists
    const book = await this.bookRepository.findOne({ where: { id: bookId } });
    if (!book) {
      throw new NotFoundException(`Book with ID ${bookId} not found`);
    }

    const note = this.bookNoteRepository.create({
      ...createDto,
      userId,
      bookId,
    });

    const savedNote = await this.bookNoteRepository.save(note);
    return new BookNoteResponseDto({
      ...savedNote,
      userId,
      bookId,
    });
  }

  async updateNote(
    userId: string,
    noteId: string,
    updateDto: UpdateBookNoteDto,
  ): Promise<BookNoteResponseDto> {
    const note = await this.bookNoteRepository.findOne({
      where: { id: noteId },
      relations: ['book', 'user'],
    });

    if (!note) {
      throw new NotFoundException(`Note with ID ${noteId} not found`);
    }

    if (note.userId !== userId) {
      throw new ForbiddenException('You are not authorized to update this note');
    }

    const updatedNote = await this.bookNoteRepository.save({
      ...note,
      ...updateDto,
    });

    return new BookNoteResponseDto({
      ...updatedNote,
      userId,
      bookId: note.bookId,
    });
  }

  async deleteNote(userId: string, noteId: string): Promise<void> {
    const note = await this.bookNoteRepository.findOne({
      where: { id: noteId },
    });

    if (!note) {
      throw new NotFoundException(`Note with ID ${noteId} not found`);
    }

    if (note.userId !== userId) {
      throw new ForbiddenException('You are not authorized to delete this note');
    }

    await this.bookNoteRepository.remove(note);
  }

  async getUserNotes(userId: string, bookId?: number): Promise<BookNoteResponseDto[]> {
    const query = this.bookNoteRepository
      .createQueryBuilder('note')
      .where('note.userId = :userId', { userId })
      .leftJoinAndSelect('note.book', 'book')
      .orderBy('note.updatedAt', 'DESC');

    if (bookId) {
      query.andWhere('note.bookId = :bookId', { bookId });
    }

    const notes = await query.getMany();
    return notes.map(
      (note) =>
        new BookNoteResponseDto({
          ...note,
          userId,
          bookId: note.bookId,
        }),
    );
  }

  async getBookNotes(bookId: number, userId?: string): Promise<BookNoteResponseDto[]> {
    const query = this.bookNoteRepository
      .createQueryBuilder('note')
      .where('note.bookId = :bookId', { bookId })
      .leftJoinAndSelect('note.user', 'user')
      .orderBy('note.updatedAt', 'DESC');

    // If user is provided, include their private notes, otherwise only public ones
    if (userId) {
      query.andWhere('(note.isPublic = true OR note.userId = :userId)', { userId });
    } else {
      query.andWhere('note.isPublic = true');
    }

    const notes = await query.getMany();
    return notes.map(
      (note) =>
        new BookNoteResponseDto({
          ...note,
          userId: note.userId,
          bookId,
        }),
    );
  }

  async getNoteById(noteId: string, userId: string): Promise<BookNoteResponseDto> {
    const note = await this.bookNoteRepository.findOne({
      where: { id: noteId },
      relations: ['book', 'user'],
    });

    if (!note) {
      throw new NotFoundException(`Note with ID ${noteId} not found`);
    }

    // Only allow access if note is public or belongs to the user
    if (!note.isPublic && note.userId !== userId) {
      throw new ForbiddenException('You are not authorized to view this note');
    }

    return new BookNoteResponseDto({
      ...note,
      userId: note.userId,
      bookId: note.bookId,
    });
  }
}
