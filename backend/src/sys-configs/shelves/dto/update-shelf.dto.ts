import { PartialType } from '@nestjs/mapped-types';
import { CreateShelfDto } from './create-shelf.dto';
import { Type } from 'class-transformer';
import { IsInt, IsOptional, IsString, Min, IsBoolean } from 'class-validator';

export class UpdateShelfDto extends PartialType(CreateShelfDto) {
  @IsString()
  @IsOptional()
  name?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  locationId?: number;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
