import { IsString, IsOptional, IsEnum, IsNotEmpty } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { BookCopyStatus } from '../entities/book-copy.entity';

export class UpdateBookCopyDto {
  @ApiPropertyOptional({
    description: 'Access number of the book copy',
    example: 'ACC-001',
  })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  accessNumber?: string;

  @ApiPropertyOptional({
    description: 'Status of the book copy',
    enum: BookCopyStatus,
    example: BookCopyStatus.AVAILABLE,
  })
  @IsOptional()
  @IsEnum(BookCopyStatus)
  status?: BookCopyStatus;

  @ApiPropertyOptional({
    description: 'Optional notes about the book copy',
    example: 'Minor wear on cover',
  })
  @IsOptional()
  @IsString()
  notes?: string;
}
