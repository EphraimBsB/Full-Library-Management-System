import { IsString, IsEnum, IsOptional } from "class-validator";
import { BookFormat } from "../entities/type.entity";

export class CreateTypeDto {
    @IsString()
    name: string;

    @IsEnum(BookFormat, {
        message: 'Format must be either "physical" or "digital"',
    })
    format: BookFormat;

    @IsString()
    @IsOptional()
    description?: string;
}
