import { Type } from 'class-transformer';
import { IsString, IsInt, IsNumber, IsOptional, IsBoolean } from 'class-validator';

export class CreateMembershipTypeDto {
  @IsString()
  name: string;

  @Type(() => Number)
  @IsInt()
  maxBooks: number;

  @Type(() => Number)
  @IsInt()
  maxDurationDays: number;

  @Type(() => Number)
  @IsInt()
  loanPeriodDays: number;

  @Type(() => Number)
  @IsInt()
  gracePeriodDays: number;

  @Type(() => Number)
  @IsInt()
  renewalLimit: number;

  @Type(() => Number)
  @IsNumber({ allowNaN: false, allowInfinity: false, maxDecimalPlaces: 2 })
  fineRate: number;

  @IsString()
  @IsOptional()
  description?: string;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
