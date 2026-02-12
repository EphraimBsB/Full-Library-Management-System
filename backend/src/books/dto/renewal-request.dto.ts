import { IsString, IsUUID, IsOptional, IsEnum } from 'class-validator';
import { BookRequestType } from '../entities/book-request.entity';

export class CreateRenewalRequestDto {
  @IsUUID()
  loanId: string;

  @IsString()
  @IsOptional()
  reason?: string;
}

export class RenewalRequestResponseDto {
  id: string;
  loanId: string;
  status: string;
  requestType: BookRequestType;
  createdAt: Date;
  message: string;
}

export class ApproveRejectRenewalDto {
  @IsString()
  @IsOptional()
  reason?: string;
}
