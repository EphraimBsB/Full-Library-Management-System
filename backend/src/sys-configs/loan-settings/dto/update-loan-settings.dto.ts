import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsInt, IsOptional, Min } from 'class-validator';

export class UpdateLoanSettingsDto {
  @ApiPropertyOptional({
    description: 'Whether to automatically approve loans when a book becomes available from queue',
    default: false,
  })
  @IsBoolean()
  @IsOptional()
  autoApproveQueueLoans?: boolean;

  @ApiPropertyOptional({
    description: 'Number of hours a user has to pick up a book after it becomes available',
    default: 24,
    minimum: 1,
  })
  @IsInt()
  @Min(1)
  @IsOptional()
  queueHoldDurationHours?: number;
}
