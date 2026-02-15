import { PartialType } from '@nestjs/mapped-types';
import { CreateMembershipTypeDto } from './create-membership-type.dto';
import { IsBoolean, IsOptional } from 'class-validator';

export class UpdateMembershipTypeDto extends PartialType(
  CreateMembershipTypeDto,
) {
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
