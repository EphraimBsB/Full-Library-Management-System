import { PartialType } from '@nestjs/mapped-types';
import { Type } from 'class-transformer';
import { IsArray, IsOptional, ValidateNested, IsString, IsNumber, IsEnum, Min, Max, IsInt } from 'class-validator';
import { BookType, BookSource } from '../enums/book-type.enum';
import { UpdateCategoryDto } from './category.dto';
import { UpdateSubjectDto } from './subject.dto';

class UpdateAccessNumberDto {
  @IsOptional()
  @IsInt()
  @Min(1)
  id?: number;
  
  @IsOptional()
  @IsString()
  number?: string;
}

export class UpdateBookDto {
  @IsString()
  @IsOptional()
  title?: string;

  @IsString()
  @IsOptional()
  author?: string;

  @IsString()
  @IsOptional()
  isbn?: string;

  @IsString()
  @IsOptional()
  publisher?: string;

  @IsNumber()
  @IsOptional()
  @Min(0)
  publicationYear?: number;

  @IsString()
  @IsOptional()
  edition?: string;

  @IsNumber()
  @IsOptional()
  @Min(0)
  totalCopies?: number;

  @IsNumber()
  @IsOptional()
  @Min(0)
  availableCopies?: number;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @IsOptional()
  coverImageUrl?: string;

  @IsEnum(BookType)
  @IsOptional()
  type?: BookType;

  @IsEnum(BookSource)
  @IsOptional()
  source?: BookSource;

  @IsString()
  @IsOptional()
  ddc?: string;

  @IsString()
  @IsOptional()
  from?: string;

  @IsString()
  @IsOptional()
  ebookUrl?: string;

  @IsString()
  @IsOptional()
  location?: string;

  @IsString()
  @IsOptional()
  shelf?: string;

  @IsNumber()
  @IsOptional()
  @Min(0)
  @Max(5)
  rating?: number;

  // Relationships
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => UpdateCategoryDto)
  @IsOptional()
  categories?: UpdateCategoryDto[];

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => UpdateSubjectDto)
  @IsOptional()
  subjects?: UpdateSubjectDto[];

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => UpdateAccessNumberDto)
  @IsOptional()
  accessNumbers?: UpdateAccessNumberDto[];
}
