import { IsNotEmpty, IsString, IsOptional, IsDateString } from 'class-validator';

export class BorrowBookDto {
  @IsString()
  @IsNotEmpty()
  accessNumber: string;
}

export class ReturnBookDto {
  @IsString()
  @IsNotEmpty()
  accessNumber: string;

  @IsDateString()
  @IsOptional()
  returnedAt?: string;
}

export class BorrowingStatsDto {
  currentBorrows: number;
  totalBorrows: number;
  overdueBorrows: number;
}

export class BookCopyHistoryDto {
  id: number;
  userId: string;
  bookId: number;
  accessNumberId: number;
  borrowedAt: Date;
  dueDate: Date;
  returnedAt: Date | null;
  fineAmount: number;
  user: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    rollNumber: string;
    phoneNumber: string;
    role: string;
  };
  book: {
    id: number;
    title: string;
    author: string;
    ddcNumber: string;
    
  };
  accessNumber: {
    id: number;
    number: string;
  };
}
