import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsDateString, IsNumber, IsObject } from 'class-validator';

export class UserBorrowStatsDto {
  @ApiProperty({ description: 'Number of active borrows' })
  @IsNumber()
  active: number;

  @ApiProperty({ description: 'Number of overdue borrows' })
  @IsNumber()
  overdue: number;

  @ApiProperty({ description: 'Number of returned borrows' })
  @IsNumber()
  returned: number;
}

export class UserProfileStatsDto {
  @ApiProperty({ type: () => UserBorrowStatsDto })
  @IsObject()
  borrow: UserBorrowStatsDto;

  @ApiProperty({ description: 'Number of favorite items' })
  @IsNumber()
  favoritesCount: number;

  @ApiProperty({ description: 'Number of notes created' })
  @IsNumber()
  notesCount: number;
}

export class UserProfileSummaryDto {
  @ApiProperty({ description: 'User ID' })
  @IsString()
  id: string;

  @ApiProperty({ description: 'User full name' })
  @IsString()
  name: string;

  @ApiProperty({ description: 'User email' })
  @IsString()
  email: string;

  @ApiProperty({ description: 'User roll number' })
  @IsString()
  rollNumber: string;

  @ApiProperty({ description: 'User phone number' })
  @IsString()
  phoneNumber: string | undefined;

  @ApiProperty({ description: 'User program' })
  @IsString()
  program: string | undefined;

  @ApiProperty({ description: 'User role' })
  @IsString()
  role: string;

  @ApiProperty({ description: 'User expiry date' })
  @IsDateString()
  expiryDate: Date | null;

  @ApiProperty({ description: 'User membership status' })
  @IsString()
  membershipStatus: string;

  @ApiProperty({ description: 'User membership type' })
  @IsString()
  membershipType: string;

  @ApiProperty({ description: 'URL to user avatar', nullable: true })
  @IsString()
  avatar: string | null;

  @ApiProperty({ description: 'Date when user joined', type: Date })
  @IsDateString()
  joinedAt: Date;

  @ApiProperty({ type: () => UserProfileStatsDto })
  @IsObject()
  stats: UserProfileStatsDto;
}

export class ApiResponseDto<T> {
  @ApiProperty({ description: 'Indicates if the request was successful' })
  success: boolean;

  @ApiProperty({ description: 'Response data' })
  data: T;
}

export class PaginatedResponseDto<T> {
  @ApiProperty({ description: 'List of items' })
  items: T[];

  @ApiProperty({ description: 'Total number of items' })
  total: number;

  @ApiProperty({ description: 'Current page number' })
  page: number;

  @ApiProperty({ description: 'Number of items per page' })
  limit: number;

  @ApiProperty({ description: 'Total number of pages' })
  totalPages: number;
}
