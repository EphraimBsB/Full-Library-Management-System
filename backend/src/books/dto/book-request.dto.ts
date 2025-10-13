import { IsString, IsNotEmpty, IsOptional, IsUUID, IsDateString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateBookRequestDto {
  @ApiProperty({ description: 'ID of the book being requested' })
  @IsString()
  @IsNotEmpty()
  bookId: string;

  @ApiProperty({ required: false, description: 'Optional reason for the request' })
  @IsString()
  @IsOptional()
  reason?: string;
}

export class ApproveRejectRequestDto {
  @ApiProperty({ description: 'Optional notes about the approval/rejection' })
  @IsString()
  @IsOptional()
  notes?: string;

  @ApiProperty({ description: 'Optional due date for the book if approved (ISO string)', required: false })
  @IsDateString()
  @IsOptional()
  dueDate?: string;

  @ApiProperty({ description: 'Optional preferred copy ID for the book if approved', required: false })
  @IsString()
  @IsOptional()
  preferredCopyId?: string;
}

export class BookRequestResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  bookId: string;

  @ApiProperty()
  userId: string;

  @ApiProperty({ enum: ['PENDING', 'APPROVED', 'REJECTED', 'CANCELLED'] })
  status: string;

  @ApiProperty({ required: false })
  reason?: string;

  @ApiProperty({ required: false })
  rejectionReason?: string;

  @ApiProperty({ required: false })
  approvedAt?: Date;

  @ApiProperty({ required: false })
  rejectedAt?: Date;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}

export class BookRequestQueryDto {
  @ApiProperty({ required: false, description: 'Filter by status' })
  @IsString()
  @IsOptional()
  status?: string;

  @ApiProperty({ required: false, description: 'Filter by book ID' })
  @IsString()
  @IsOptional()
  bookId?: string;

  @ApiProperty({ required: false, description: 'Filter by user ID' })
  @IsString()
  @IsOptional()
  userId?: string;

  @ApiProperty({ required: false, description: 'Page number for pagination' })
  @IsOptional()
  page?: number;

  @ApiProperty({ required: false, description: 'Number of items per page' })
  @IsOptional()
  limit?: number;
}
