import { IsString, IsNumber, IsBoolean, IsOptional, IsUUID } from 'class-validator';

export class CreateBookNoteDto {
  @IsString()
  content: string;

  @IsNumber()
  @IsOptional()
  pageNumber?: number;

  @IsBoolean()
  @IsOptional()
  isPublic: boolean = false;

  @IsNumber()
  @IsOptional()
  bookId: number;
}

export class UpdateBookNoteDto {
  @IsString()
  @IsOptional()
  content?: string;

  @IsNumber()
  @IsOptional()
  pageNumber?: number;

  @IsBoolean()
  @IsOptional()
  isPublic?: boolean;

  @IsNumber()
  @IsOptional()
  bookId?: number;
}

export class BookNoteResponseDto {
  userId: string;
  bookId: number;
  bookNotes: {
    id: string;
    content: string;
    pageNumber?: number;
    isPublic: boolean;
    createdAt: Date;
    updatedAt: Date;
  }[];

  constructor(partial: Partial<BookNoteResponseDto>) {
    Object.assign(this, partial);
  }
}
