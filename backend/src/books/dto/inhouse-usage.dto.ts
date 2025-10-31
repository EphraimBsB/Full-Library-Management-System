import { IsDateString, IsOptional, IsNumber } from 'class-validator';
import { InhouseUsageStatus } from '../entities/book-inhouse-usage.entity';
import { User } from 'src/users/entities/user.entity';
import { BookCopy } from '../entities/book-copy.entity';

export class StartInhouseUsageDto {
  @IsNumber()
  bookId: number;

  @IsNumber()
  @IsOptional()
  copyId?: number;
}

export class EndInhouseUsageDto {
  @IsDateString()
  @IsOptional()
  endedAt?: Date;
}

export class InhouseUsageResponseDto {
  id: string;
  user: User;
  copy: BookCopy | null;
  startedAt: Date;
  endedAt: Date | null;
  durationMinutes: number | null;
  status: InhouseUsageStatus;
  createdAt: Date;
}
