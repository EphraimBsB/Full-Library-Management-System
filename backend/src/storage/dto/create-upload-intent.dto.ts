import { IsEnum, IsInt, IsMimeType, IsOptional, IsString, Max, Min } from 'class-validator';

export enum UploadType {
  IMAGE = 'image',
  EBOOK = 'ebook',
}

export class CreateUploadIntentDto {
  @IsEnum(UploadType)
  type: UploadType;

  @IsMimeType()
  mimeType: string;

  @IsInt()
  @Min(1)
  @Max(50 * 1024 * 1024) // 50MB default cap; adjust as needed
  size: number;

  @IsOptional()
  @IsString()
  extension?: string;
}
