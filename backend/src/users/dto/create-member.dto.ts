import { IsString, IsEmail, IsOptional, IsNotEmpty, IsNumber } from 'class-validator';

export class CreateMemberDto {
  @IsString()
  @IsNotEmpty()
  firstName: string;

  @IsString()
  @IsNotEmpty()
  lastName: string;

  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsString()
  @IsOptional()
  phoneNumber?: string;

  @IsString()
  @IsOptional()
  rollNumber?: string;

  @IsString()
  @IsOptional()
  course?: string;

  @IsString()
  @IsOptional()
  degree?: string;

  @IsString()
  @IsOptional()
  password?: string;

  @IsNumber()
  @IsNotEmpty()
  membershipTypeId: number;

  @IsNumber()
  @IsOptional()
  roleId?: number;
}
