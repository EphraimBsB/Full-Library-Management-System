import { IsString, IsOptional } from 'class-validator';

export class CreateVisitDto {
  @IsString()
  @IsOptional()
  sessionId?: string;

  @IsString()
  @IsOptional()
  pageVisited?: string;

  @IsString()
  @IsOptional()
  userAgent?: string;

  @IsString()
  @IsOptional()
  searchQuery?: string;

  @IsOptional()
  resultsCount?: number;

  @IsOptional()
  duration?: number;
}

