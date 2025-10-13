import { PartialType } from '@nestjs/mapped-types';
import { CreateDegreeDto } from './create-degree.dto';
import { IsString, IsEnum, IsOptional } from 'class-validator';
import { DegreeLevel } from '../entities/degree.entity';

export class UpdateDegreeDto extends PartialType(CreateDegreeDto) {
    @IsString()
    @IsOptional()
    name?: string;

    @IsEnum(DegreeLevel)
    @IsOptional()
    level?: DegreeLevel;

    @IsString()
    @IsOptional()
    description?: string;
}
