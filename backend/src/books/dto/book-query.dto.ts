import { IsOptional, IsString, IsInt, Min, IsArray, IsEnum } from 'class-validator';
import { Type } from 'class-transformer';
import { BookType } from '../enums/book-type.enum';

export class BookQueryDto {
  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsString()
  author?: string;

  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsString()
  isbn?: string;

  @IsOptional()
  @IsInt()
  @Type(() => Number)
  @Min(0)
  minYear?: number;

  @IsOptional()
  @IsInt()
  @Type(() => Number)
  @Min(0)
  maxYear?: number;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  categories?: string[];

  @IsOptional()
  @IsEnum(BookType)
  type?: BookType;

  @IsOptional()
  @IsInt()
  @Type(() => Number)
  @Min(1)
  minAvailable?: number = 1;

  @IsOptional()
  @IsInt()
  @Type(() => Number)
  @Min(0)
  page?: number = 1;

  @IsOptional()
  @IsInt()
  @Type(() => Number)
  @Min(5)
  limit?: number = 10;

  @IsOptional()
  @IsString()
  sortBy?: string = 'title';

  @IsOptional()
  @IsString()
  sortOrder?: 'ASC' | 'DESC' = 'ASC';
}
