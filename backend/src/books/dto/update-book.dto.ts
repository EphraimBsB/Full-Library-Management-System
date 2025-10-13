import { Type } from 'class-transformer';
import { 
  IsArray, 
  IsOptional, 
  ValidateNested, 
  IsString, 
  IsNumber, 
  Min, 
  Max, 
  IsInt, 
  IsISBN, 
  IsUrl, 
} from 'class-validator';
import { CreateCategoryDto } from 'src/sys-configs/categories/dto/create-category.dto';
import { CreateSubjectDto } from 'src/sys-configs/subjects/dto/create-subject.dto';

class BookCopiesDto {
  @IsString()
  @IsOptional()
  accessNumber?: string;

  @IsString()
  @IsOptional()
  notes?: string;
}

export class UpdateBookDto {
  @IsString()
  @IsOptional()
  title?: string;

  @IsString()
  @IsOptional()
  author?: string;

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
  @IsOptional()
  totalCopies?: number;

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
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => CreateCategoryDto)
  categories?: CreateCategoryDto[];

  @IsArray()
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => CreateSubjectDto)
  subjects?: CreateSubjectDto[];

  @IsNumber()
  @IsOptional()
  typeId?: number;

  @IsNumber()
  @IsOptional()
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

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(5)
  rating?: number;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => BookCopiesDto)
  @IsOptional()
  copies?: BookCopiesDto[];
}
