import {
  IsString,
  IsOptional,
  IsInt,
  IsArray,
  IsUrl,
  IsISBN,
  ValidateNested,
  IsNotEmpty,
  ArrayNotEmpty,
  Min,
  IsNumber,
  Max
} from 'class-validator';
import { Type } from 'class-transformer';
import { CreateCategoryDto } from 'src/sys-configs/categories/dto/create-category.dto';
import { CreateSubjectDto } from 'src/sys-configs/subjects/dto/create-subject.dto';

export class BookCopiesDto {
  @IsString()
  @IsNotEmpty()
  accessNumber: string;

  @IsOptional()
  @IsString()
  notes?: string;
}

export class CreateBookDto {
  @IsString()
  title: string;

  @IsString()
  author: string;

  @IsOptional()
  @IsString()
  @IsISBN()
  isbn?: string;

  @IsOptional()
  @IsString()
  publisher?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  publicationYear?: number;

  @IsOptional()
  @IsString()
  edition?: string;

  @IsInt()
  @Min(1)
  totalCopies: number = 1;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsUrl({
    require_tld: false,
    require_protocol: true,
    protocols: ['http', 'https']
  })
  coverImageUrl?: string;

  @IsArray()
  @ArrayNotEmpty({ message: 'At least one category is required' })
  @ValidateNested({ each: true })
  @Type(() => CreateCategoryDto)
  categories: CreateCategoryDto[];

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateSubjectDto)
  @IsOptional()
  subjects: CreateSubjectDto[] = [];

  @IsNumber()
  @IsNotEmpty()
  typeId: number;

  @IsOptional()
  @IsNumber()
  sourceId?: number;

  @IsOptional()
  @IsString()
  ddc?: string;

  @IsOptional()
  @IsString()
  price?: string;

  @IsOptional()
  @IsUrl({
    require_tld: false,
    require_protocol: true,
    protocols: ['http', 'https']
  })
  ebookUrl?: string;

  @IsOptional()
  @IsString()
  location?: string;

  @IsOptional()
  @IsString()
  shelf?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => BookCopiesDto)
  @IsOptional()
  copies: BookCopiesDto[] = [];

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(5)
  rating: number = 0;
}
