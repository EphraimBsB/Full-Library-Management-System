import { PartialType } from '@nestjs/mapped-types';
import { CreateTypeDto } from './create-type.dto';
import { IsEnum, IsOptional, IsString } from 'class-validator';
import { BookFormat } from '../entities/type.entity';

export class UpdateTypeDto extends PartialType(CreateTypeDto) {
    @IsString()
    @IsOptional()
    name?: string;

    @IsEnum(BookFormat, {
        message: 'Format must be either "physical" or "digital"',
    })
    @IsOptional()
    format?: BookFormat;

    @IsString()
    @IsOptional()
    description?: string;
}
