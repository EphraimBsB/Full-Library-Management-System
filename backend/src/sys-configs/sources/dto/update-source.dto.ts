import { PartialType } from '@nestjs/mapped-types';
import { CreateSourceDto } from './create-source.dto';
import { IsDateString, IsOptional, IsString } from 'class-validator';

export class UpdateSourceDto extends PartialType(CreateSourceDto) {
    @IsString()
    @IsOptional()
    name?: string;

    @IsString()
    @IsOptional()
    supplier?: string;

    @IsDateString()
    @IsOptional()
    dateAcquired?: Date;
}
