import { IsNotEmpty, IsUUID, IsString, IsOptional, IsEmail, IsPhoneNumber, IsDateString, IsNumber } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateMembershipRequestDto {
  @ApiProperty({ description: 'ID of the membership type being requested' })
  @IsNumber()
  @IsNotEmpty()
  membershipTypeId: number;

  @ApiProperty({ description: 'User email address' })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty({ description: 'User first name' })
  @IsString()
  @IsNotEmpty()
  firstName: string;

  @ApiProperty({ description: 'User last name' })
  @IsString()
  @IsNotEmpty()
  lastName: string;

  @ApiProperty({ required: false, description: 'User phone number' })
  @IsPhoneNumber()
  @IsOptional()
  phoneNumber?: string;

  @ApiProperty({ required: false, description: 'User profile image URL' })
  @IsString()
  @IsOptional()
  avatarUrl?: string;

  @ApiProperty({ required: false, description: 'User roll/registration number' })
  @IsString()
  @IsOptional()
  rollNumber?: string;

  @ApiProperty({ required: false, description: 'User course of study' })
  @IsString()
  @IsOptional()
  course?: string;

  @ApiProperty({ required: false, description: 'User degree program' })
  @IsString()
  @IsOptional()
  degree?: string;

  @ApiProperty({ required: false, description: 'Additional notes for the request' })
  @IsString()
  @IsOptional()
  notes?: string;

  @ApiProperty({ required: false, description: 'User role' })
  @IsNumber()
  @IsOptional()
  roleId?: number;
}