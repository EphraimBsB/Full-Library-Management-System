import { IsString, IsOptional, IsInt, Min } from 'class-validator';

export class CreateSubjectDto {
  @IsString()
  name: string;

  @IsString()
  @IsOptional()
  description?: string;
}

export class UpdateSubjectDto {
  @IsInt()
  @Min(1)
  @IsOptional()
  id?: number;

  @IsString()
  @IsOptional()
  name?: string;

  @IsString()
  @IsOptional()
  description?: string;
}

export class SubjectResponseDto {
  @IsInt()
  id: number;

  @IsString()
  name: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  createdAt: Date;

  @IsString()
  updatedAt: Date;
}
