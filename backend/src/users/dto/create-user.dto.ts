import { IsEmail, IsNotEmpty, IsOptional, IsString, IsDateString, IsBoolean, IsUUID } from 'class-validator';

export class CreateUserDto {
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
  @IsNotEmpty()
  rollNumber: string;

  @IsString()
  @IsOptional()
  phoneNumber?: string;

  @IsString()
  @IsOptional()
  profileImageUrl?: string;

  @IsString()
  @IsOptional()
  course?: string;

  @IsString()
  @IsOptional()
  degree?: string;

  @IsDateString()
  @IsOptional()
  dateOfBirth?: Date;

  @IsBoolean()
  @IsOptional()
  isActive: boolean = true;

  @IsDateString()
  @IsNotEmpty()
  joinDate: Date;

  @IsDateString()
  @IsOptional()
  expiryDate?: Date;

  @IsString()
  @IsNotEmpty()
  password: string;
}
