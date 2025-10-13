import { IsString, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ProcessMembershipRequestDto {
  @ApiProperty({ required: false, description: 'Reason for rejection (if applicable)' })
  @IsString()
  @IsOptional()
  reason?: string;
}
