import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  IsEmail,
  IsUrl,
  MaxLength,
  IsEnum,
} from 'class-validator';
import { MembershipStatus } from '../../membership/entities/membership.entity';

export class UpdateProfileDto {
  @ApiProperty({ description: 'First name', required: false })
  @IsString()
  @IsOptional()
  @MaxLength(50, { message: 'First name must not exceed 50 characters' })
  firstName?: string;

  @ApiProperty({ description: 'Last name', required: false })
  @IsString()
  @IsOptional()
  @MaxLength(50, { message: 'Last name must not exceed 50 characters' })
  lastName?: string;

  @ApiProperty({ description: 'Email address', required: false })
  @IsEmail({}, { message: 'Please provide a valid email address' })
  @IsOptional()
  email?: string;

  @ApiProperty({ description: 'Phone number', required: false })
  @IsString()
  @IsOptional()
  @MaxLength(20, { message: 'Phone number must not exceed 20 characters' })
  phoneNumber?: string;

  @ApiProperty({ description: 'Degree or program', required: false })
  @IsString()
  @IsOptional()
  @MaxLength(100, { message: 'Degree must not exceed 100 characters' })
  degree?: string;

  @ApiProperty({ description: 'Semester', required: false })
  @IsString()
  @IsOptional()
  @MaxLength(20, { message: 'Semester must not exceed 20 characters' })
  semester?: string;

  @ApiProperty({ description: 'Avatar URL', required: false })
  @IsUrl({}, { message: 'Please provide a valid URL for avatar' })
  @IsOptional()
  avatarUrl?: string;

  @ApiProperty({ description: 'Membership status', required: false })
  @IsString()
  @IsOptional()
  @IsEnum(MembershipStatus)
  membershipStatus?: MembershipStatus;
}
