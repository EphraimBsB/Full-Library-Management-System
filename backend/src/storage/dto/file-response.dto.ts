import { ApiProperty } from '@nestjs/swagger';
import { FileRecord } from '../entities/file-record.entity';

export class FileResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  url: string;

  @ApiProperty()
  originalName: string;

  @ApiProperty()
  mimeType: string;

  @ApiProperty()
  size: number;

  @ApiProperty()
  createdAt: Date;

  constructor(file: FileRecord, baseUrl: string) {
    this.id = file.id;
    this.url = file.getUrl(baseUrl);
    this.originalName = file.originalName;
    this.mimeType = file.mimeType;
    this.size = file.size;
    this.createdAt = file.createdAt;
  }
}
