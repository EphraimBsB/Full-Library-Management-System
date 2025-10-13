import { IsString, IsInt, IsNumber, IsOptional } from 'class-validator';

export class CreateMembershipTypeDto {
  @IsString()
  name: string;

  @IsInt()
  maxBooks: number;

  @IsInt()
  maxDurationDays: number;

  @IsInt()
  renewalLimit: number;

  @IsNumber()
  fineRate: number;

  @IsString()
  @IsOptional()
  description?: string;
}
