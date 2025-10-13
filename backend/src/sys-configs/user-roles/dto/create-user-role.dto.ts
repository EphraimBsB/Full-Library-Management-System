import { IsString, IsOptional, IsArray } from 'class-validator';

export class CreateUserRoleDto {
  @IsString()
  name: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsArray()
  @IsOptional()
  permissions?: string[];
}
