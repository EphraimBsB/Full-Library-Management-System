import { IsUUID, IsOptional, ValidateIf } from 'class-validator';

export class CreateLoanDto {
  @IsUUID()
  @ValidateIf(o => !o.preferredCopyId) // Only require bookId if preferredCopyId is not provided
  bookId?: string;

  @IsUUID()
  @IsOptional()
  preferredCopyId?: string;

  @IsUUID()
  userId: string;

  @IsUUID()
  @IsOptional()
  requestId?: string;
  
  @IsUUID()
  @IsOptional()
  approvedById?: string;

  constructor() {
    if (!this.bookId && !this.preferredCopyId) {
      throw new Error('Either bookId or preferredCopyId must be provided');
    }
  }
}
