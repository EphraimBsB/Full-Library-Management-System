import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString, IsEnum } from 'class-validator';

export enum ExportFormat {
  EXCEL = 'excel',
  CSV = 'csv',
  JSON = 'json'
}

export enum ExportType {
  BOOKS = 'books',
  USERS = 'users',
  LOANS = 'loans',
  CATEGORIES = 'categories',
  SUBJECTS = 'subjects',
  PUBLISHERS = 'publishers',
  AUTHORS = 'authors'
}

export class ExportQueryDto {
  @ApiProperty({ 
    description: 'Export format',
    enum: ExportFormat,
    default: ExportFormat.EXCEL
  })
  @IsOptional()
  @IsEnum(ExportFormat)
  format?: ExportFormat = ExportFormat.EXCEL;

  @ApiProperty({ 
    description: 'Date range start (YYYY-MM-DD)',
    required: false
  })
  @IsOptional()
  @IsString()
  startDate?: string;

  @ApiProperty({ 
    description: 'Date range end (YYYY-MM-DD)',
    required: false
  })
  @IsOptional()
  @IsString()
  endDate?: string;

  @ApiProperty({ 
    description: 'Filter by specific field',
    required: false
  })
  @IsOptional()
  @IsString()
  filter?: string;

  @ApiProperty({ 
    description: 'Search term',
    required: false
  })
  @IsOptional()
  @IsString()
  search?: string;
}
