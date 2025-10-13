export interface FileMetadata {
  width?: number;
  height?: number;
  duration?: number;
  pages?: number;
  format?: string;
  size: number;
  mimeType: string;
  checksum?: string;
  [key: string]: any;
}

export interface ProcessedFile {
  buffer: Buffer;
  metadata: Partial<FileMetadata>;
}

export interface FileUploadOptions {
  folder?: string;
  isPublic?: boolean;
  generateThumbnail?: boolean;
  maxDimension?: number;
  quality?: number;
}

export interface UploadedFile {
  fieldname: string;
  originalname: string;
  encoding: string;
  mimetype: string;
  size: number;
  buffer: Buffer;
  destination?: string;
  filename?: string;
  path?: string;
}
