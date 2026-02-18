import { IsNotEmpty, IsString, IsOptional, IsBoolean } from 'class-validator';

export class RegisterStudentDto {
  @IsString()
  @IsNotEmpty()
  rollNumber: string;

  @IsString()
  @IsNotEmpty()
  password: string;

  @IsString()
  @IsOptional()
  firstName?: string;

  @IsString()
  @IsOptional()
  lastName?: string;

  @IsString()
  @IsOptional()
  programme?: string;

  @IsString()
  @IsOptional()
  semester?: string;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean = true;
}
