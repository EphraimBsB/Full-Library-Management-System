import { IsEmail, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class TestEmailDto {
  @IsEmail()
  @IsNotEmpty()
  to: string;

  @IsString()
  @IsOptional()
  name?: string = 'User';
}
