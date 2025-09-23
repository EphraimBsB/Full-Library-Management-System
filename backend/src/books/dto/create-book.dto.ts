import { 
  IsString, 
  IsOptional, 
  IsInt, 
  IsArray, 
  IsUrl, 
  IsEnum, 
  IsNumber, 
  Min, 
  Max, 
  IsISBN,
  ArrayMinSize,
  ValidateNested,
  IsUUID,
  IsNotEmpty,
  ArrayNotEmpty
} from 'class-validator';
import { Type } from 'class-transformer';
import { BookType, BookSource } from '../enums/book-type.enum';
import { CreateCategoryDto } from './category.dto';
import { CreateSubjectDto } from './subject.dto';

class AccessNumberDto {
  @IsString()
  @IsNotEmpty()
  number: string;
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
  @IsUrl()
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

  @IsEnum(BookType)
  type: BookType = BookType.PHYSICAL;

  @IsOptional()
  @IsEnum(BookSource)
  source?: BookSource;

  @IsOptional()
  @IsString()
  ddc?: string;

  @IsOptional()
  @IsString()
  from?: string;

  @IsOptional()
  @IsUrl()
  ebookUrl?: string;

  @IsOptional()
  @IsString()
  location?: string;

  @IsOptional()
  @IsString()
  shelf?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AccessNumberDto)
  @IsOptional()
  accessNumbers: AccessNumberDto[] = [];

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(5)
  rating: number = 0;
}
