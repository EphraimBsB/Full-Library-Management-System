import { Injectable, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { S3Client, HeadObjectCommand, PutObjectCommand } from '@aws-sdk/client-s3';
import { CreateUploadIntentDto, UploadType } from './dto/create-upload-intent.dto';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

export interface UploadIntentResult {
  key: string;
  presignedUrl: string;
  expiresAt: string;
  publicUrl?: string;
  contentType: string;
}

@Injectable()
export class StorageService {
  private s3: S3Client;
  private bucket: string;
  private region: string;
  private publicBaseUrl?: string;

  constructor(private readonly config: ConfigService) {
    this.region = this.config.get<string>('S3_REGION', 'auto');
    this.bucket = this.config.get<string>('S3_BUCKET', '');

    if (!this.bucket) {
      throw new Error('S3_BUCKET is not configured');
    }

    this.s3 = new S3Client({
      region: this.region,
      credentials: this.config.get('S3_ACCESS_KEY_ID') && this.config.get('S3_SECRET_ACCESS_KEY') ? {
        accessKeyId: this.config.get<string>('S3_ACCESS_KEY_ID')!,
        secretAccessKey: this.config.get<string>('S3_SECRET_ACCESS_KEY')!,
      } : undefined,
      endpoint: this.config.get<string>('S3_ENDPOINT') || undefined,
      forcePathStyle: this.config.get<string>('S3_FORCE_PATH_STYLE') === 'true' || undefined,
    });

    this.publicBaseUrl = this.config.get<string>('S3_PUBLIC_BASE_URL') || undefined;
  }

  async createUploadIntent(userId: string, dto: CreateUploadIntentDto): Promise<UploadIntentResult> {
    // Basic validation
    if (dto.type === UploadType.EBOOK) {
      // Keep ebooks private; ensure allowed mime
      if (!/^application\/(pdf|epub\+zip|octet-stream)/.test(dto.mimeType)) {
        throw new BadRequestException('Unsupported ebook mime type');
      }
    } else if (dto.type === UploadType.IMAGE) {
      if (!/^image\//.test(dto.mimeType)) {
        throw new BadRequestException('Unsupported image mime type');
      }
    }

    const folder = dto.type === UploadType.IMAGE ? 'images' : 'ebooks';
    const ext = dto.extension ? dto.extension.replace(/^\./, '') : this.guessExt(dto.mimeType);
    const key = `${folder}/${userId}/${Date.now()}-${Math.random().toString(36).slice(2)}${ext ? '.' + ext : ''}`;

    // Create a presigned PUT URL
    const putCmd = new PutObjectCommand({
      Bucket: this.bucket,
      Key: key,
      ContentType: dto.mimeType,
      ACL: dto.type === UploadType.IMAGE && this.config.get('S3_PUBLIC_READ_IMAGES') === 'true' ? 'public-read' : undefined,
    });

    const expiresIn = 60 * 5; // 5 minutes
    const presignedUrl = await getSignedUrl(this.s3, putCmd, { expiresIn });

    const result: UploadIntentResult = {
      key,
      presignedUrl,
      expiresAt: new Date(Date.now() + expiresIn * 1000).toISOString(),
      contentType: dto.mimeType,
    };

    if (this.publicBaseUrl && dto.type === UploadType.IMAGE && this.config.get('S3_PUBLIC_READ_IMAGES') === 'true') {
      result.publicUrl = `${this.publicBaseUrl.replace(/\/$/, '')}/${key}`;
    }

    return result;
  }

  async confirmUpload(key: string) {
    // Verify the object exists and get metadata
    const head = await this.s3.send(new HeadObjectCommand({ Bucket: this.bucket, Key: key }));

    return {
      key,
      size: head.ContentLength ?? null,
      contentType: head.ContentType ?? null,
      etag: head.ETag ?? null,
      lastModified: head.LastModified?.toISOString() ?? null,
      publicUrl: this.publicBaseUrl ? `${this.publicBaseUrl.replace(/\/$/, '')}/${key}` : null,
    };
  }

  private guessExt(mime: string): string | null {
    if (mime.startsWith('image/')) return mime.split('/')[1];
    if (mime === 'application/pdf') return 'pdf';
    if (mime === 'application/epub+zip') return 'epub';
    return null;
  }
}
