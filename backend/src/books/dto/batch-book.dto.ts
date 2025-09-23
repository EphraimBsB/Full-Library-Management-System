import { Type } from 'class-transformer';
import { IsArray, ValidateNested, IsOptional, IsInt, Min, Max } from 'class-validator';
import { CreateBookDto } from './create-book.dto';
import { UpdateBookDto } from './update-book.dto';

export class BatchCreateBooksDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateBookDto)
  books: CreateBookDto[];
}

export class BatchUpdateBookDto {
  @IsInt()
  @Min(1)
  id: number;

  @ValidateNested()
  @Type(() => UpdateBookDto)
  data: UpdateBookDto;
}

export class BatchUpdateBooksDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => BatchUpdateBookDto)
  updates: BatchUpdateBookDto[];
}
