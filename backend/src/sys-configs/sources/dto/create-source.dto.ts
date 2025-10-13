import { IsDateString, IsOptional, IsString } from "class-validator";

export class CreateSourceDto {
    @IsString()
    name: string;

    @IsString()
    @IsOptional()
    supplier?: string;

    @IsDateString()
    @IsOptional()
    dateAcquired?: Date;
}
