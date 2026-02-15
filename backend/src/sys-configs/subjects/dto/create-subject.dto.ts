import { IsOptional, IsString, IsBoolean } from 'class-validator';

export class CreateSubjectDto {
  @IsString()
  name: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
