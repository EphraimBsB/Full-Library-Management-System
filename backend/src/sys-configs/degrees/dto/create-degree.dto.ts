import { IsString, IsEnum, IsOptional } from 'class-validator';
import { DegreeLevel } from '../entities/degree.entity';

export class CreateDegreeDto {
  @IsString()
  name: string;

  @IsEnum(DegreeLevel)
  level: DegreeLevel;

  @IsString()
  @IsOptional()
  description?: string;
}
