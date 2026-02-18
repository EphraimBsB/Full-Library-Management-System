import { PartialType } from '@nestjs/mapped-types';
import { CreateUserDto } from './create-user.dto';
import { IsOptional, IsString, IsNumber } from 'class-validator';
import { MembershipStatus } from '../../membership/entities/membership.entity';

export class UpdateUserDto extends PartialType(CreateUserDto) {
  // Remove password from update to handle it separately
  password?: never;

  @IsNumber()
  @IsOptional()
  membershipTypeId?: number;

  @IsString()
  @IsOptional()
  membershipStatus?: MembershipStatus;

  // Make rollNumber optional for updates
  @IsString()
  @IsOptional()
  rollNumber?: string;
}
