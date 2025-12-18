import { IsNotEmpty, IsString, IsOptional, IsEmail } from 'class-validator';

export class LoginDto {
  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  rollNumber?: string;

  @IsString()
  @IsNotEmpty()
  password: string;
}
