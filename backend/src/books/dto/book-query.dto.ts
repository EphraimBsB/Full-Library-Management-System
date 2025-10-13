import { IsOptional, IsString, IsInt, Min, Max, IsArray, IsIn } from 'class-validator';
import { Type } from 'class-transformer';

const SORT_FIELDS = [
  'title', 
  'author', 
  'publicationYear', 
  'createdAt', 
  'updatedAt', 
  'availableCopies',
  'totalCopies',
  'publisher',
  'edition',
  'ddc',
  'location',
  'shelf',
  'queueCount',
  'rating'
] as const;

type SortField = typeof SORT_FIELDS[number];
type SortOrder = 'ASC' | 'DESC';

export class BookQueryDto {
  @IsOptional()
  @IsInt()
  @Type(() => Number)
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @IsInt()
  @Type(() => Number)
  @Min(1)
  @Max(100)
  limit?: number = 10;

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
  @Min(1000)
  @Max(3000)
  minYear?: number;

  @IsOptional()
  @IsInt()
  @Type(() => Number)
  @Min(1000)
  @Max(3000)
  maxYear?: number;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @Type(() => String)
  categories?: string[];

  @IsOptional()
  @IsString()
  type?: string;

  @IsOptional()
  @IsInt()
  @Type(() => Number)
  @Min(0)
  minAvailable?: number = 0;

  @IsOptional()
  @IsIn(SORT_FIELDS, {
    message: `sortBy must be one of: ${SORT_FIELDS.join(', ')}`
  })
  sortBy?: SortField = 'title';

  @IsOptional()
  @IsIn(['ASC', 'DESC'], {
    message: "sortOrder must be either 'ASC' or 'DESC'"
  })
  sortOrder?: SortOrder = 'ASC';
}
