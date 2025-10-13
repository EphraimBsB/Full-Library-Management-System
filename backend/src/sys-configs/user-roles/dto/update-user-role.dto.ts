import { PartialType } from '@nestjs/mapped-types';
import { CreateUserRoleDto } from './create-user-role.dto';
import { IsString, IsOptional, IsArray } from 'class-validator';

export class UpdateUserRoleDto extends PartialType(CreateUserRoleDto) {
    @IsString()
    @IsOptional()
    name?: string;

    @IsString()
    @IsOptional()
    description?: string;

    @IsArray()
    @IsOptional()
    permissions?: string[];
}
