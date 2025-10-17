import { IsInt } from 'class-validator';
import { Book } from '../entities/book.entity';

export class ToggleBookFavoriteDto {
  @IsInt()
  bookId: number;
}

export class BookFavoriteResponseDto {
  book: Book;
  constructor(partial: Partial<BookFavoriteResponseDto>) {
    Object.assign(this, partial);
  }
}
