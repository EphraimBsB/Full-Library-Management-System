import { 
  Injectable, 
  Logger, 
  NotFoundException, 
  InternalServerErrorException, 
  BadRequestException 
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as path from 'path';
import * as fs from 'fs/promises';
import { createReadStream } from 'fs';
import { FileRecord } from './entities/file-record.entity';
import { FileUtils } from './utils/file.utils';
import { StorageUtils } from './utils/storage.utils';
import { 
  ProcessedFile, 
  FileUploadOptions,
  UploadedFile
} from './interfaces/file-metadata.interface';
import { STORAGE_CONSTANTS } from './storage.constants';
import { ImageVariant } from './file-type.enum';

@Injectable()
export class StorageService {
  private readonly logger = new Logger(StorageService.name);
  private readonly storagePath: string;
  private readonly tempPath: string;
  private readonly baseUrl: string;

  constructor(
    @InjectRepository(FileRecord)
    private fileRepository: Repository<FileRecord>,
    private configService: ConfigService,
  ) {
    this.storagePath = path.join(process.cwd(), STORAGE_CONSTANTS.STORAGE_PATH);
    this.tempPath = path.join(this.storagePath, STORAGE_CONSTANTS.TEMP_PATH);
    this.baseUrl = this.configService.get('APP_URL', 'http://localhost:3000/api/v1');
    
    // Ensure directories exist
    this.ensureStorageStructure();
  }

  getBaseUrl(): string {
    return this.baseUrl;
  }

  private async ensureStorageStructure() {
    await StorageUtils.ensureDirectoryExists(this.storagePath);
    await StorageUtils.ensureDirectoryExists(this.tempPath);
    await StorageUtils.ensureDirectoryExists(path.join(this.storagePath, 'originals'));
    await StorageUtils.ensureDirectoryExists(path.join(this.storagePath, 'processed'));
  }

  private generateStoragePath(
    userId: string,
    originalName: string,
    options: { folder?: string } = {},
  ): { relativePath: string; fullPath: string } {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    
    const relativeDir = options.folder 
      ? path.join('custom', options.folder, userId, String(year), month, day)
      : path.join('uploads', userId, String(year), month, day);
    
    const filename = FileUtils.generateUniqueFilename(originalName);
    const relativePath = path.join(relativeDir, filename);
    const fullPath = path.join(this.storagePath, 'originals', relativePath);
    
    return { relativePath, fullPath };
  }

  async uploadFile(
    file: UploadedFile,
    userId: string,
    options: FileUploadOptions = {},
  ): Promise<FileRecord> {
    try {
      // Validate file
      if (!FileUtils.validateMimeType(file.mimetype)) {
        throw new BadRequestException(`File type ${file.mimetype} is not allowed`);
      }

      // Generate storage paths
      const { relativePath, fullPath } = this.generateStoragePath(
        userId,
        file.originalname,
        { folder: options.folder },
      );

      // Ensure directory exists
      await StorageUtils.ensureDirectoryExists(path.dirname(fullPath));

      // Process file if it's an image
      let processedFile: ProcessedFile = {
        buffer: file.buffer,
        metadata: {
          mimeType: file.mimetype,
          size: file.size,
        },
      };

      if (FileUtils.isImageMimeType(file.mimetype)) {
        processedFile = await this.processImageFile(file, options);
      }

      // Save file
      await fs.writeFile(fullPath, processedFile.buffer);

      // Create file record
      const fileRecord = this.fileRepository.create({
        originalName: file.originalname,
        storagePath: relativePath,
        mimeType: file.mimetype,
        size: processedFile.buffer.length,
        userId,
        isPublic: options.isPublic || false,
        metadata: {
          ...processedFile.metadata,
          checksum: await FileUtils.calculateChecksum(processedFile.buffer),
        },
      });

      const savedRecord = await this.fileRepository.save(fileRecord);
      
      // Add the URL to the response
      savedRecord.url = savedRecord.getUrl(this.getBaseUrl());
      
      return savedRecord;
    } catch (error: any) {
      this.logger.error(`File upload failed: ${error.message}`, error.stack);
      throw new InternalServerErrorException(`File upload failed: ${error.message}`);
    }
  }

  private async processImageFile(
    file: UploadedFile,
    options: FileUploadOptions = {},
  ): Promise<ProcessedFile> {
    try {
      const processOptions = {
        width: options.maxDimension,
        height: options.maxDimension,
      };

      return await StorageUtils.processImage(file.buffer, processOptions);
    } catch (error) {
      this.logger.warn(`Image processing failed, using original: ${error.message}`);
      return {
        buffer: file.buffer,
        metadata: {
          mimeType: file.mimetype,
          size: file.size,
        },
      };
    }
  }

  async getFileStream(
    id: string,
    variant: ImageVariant = ImageVariant.ORIGINAL,
    format?: 'webp' | 'original'
  ): Promise<{ 
    stream: NodeJS.ReadableStream; 
    file: FileRecord;
    contentType: string;
    filePath: string;
  }> {
    console.log(`[getFileStream] Looking up file record with ID: ${id}`);
    const fileRecord = await this.fileRepository.findOne({ where: { id } });
    if (!fileRecord) {
      console.error(`[getFileStream] File record not found for ID: ${id}`);
      throw new NotFoundException('File not found in database');
    }

    console.log(`[getFileStream] Found file record:`, {
      id: fileRecord.id,
      originalName: fileRecord.originalName,
      storagePath: fileRecord.storagePath,
      mimeType: fileRecord.mimeType,
      variant: variant || 'original',
      requestedFormat: format || 'original'
    });

    // The storagePath is relative to the storage directory
    // For original files, they are stored in the 'originals' directory
    const originalFilePath = path.join(this.storagePath, 'originals', fileRecord.storagePath);
    console.log(`[getFileStream] Original file path: ${originalFilePath}`);
    
    let filePath = originalFilePath;
    let contentType = fileRecord.mimeType;
    
    // For non-original variants of images, check if we need to generate them
    if (variant !== ImageVariant.ORIGINAL && FileUtils.isImageMimeType(fileRecord.mimeType)) {
      // If format is explicitly requested as webp, ensure we use the webp variant
      const useWebP = format === 'webp' || variant === ImageVariant.THUMBNAIL;
      const variantPath = this.getVariantPath(fileRecord, variant);
      const variantFilePath = path.join(
        this.storagePath, 
        'processed', 
        useWebP ? variantPath.replace(/\.(jpg|jpeg|png)$/i, '.webp') : variantPath
      );
      
      console.log(`[getFileStream] Variant path (${variant}): ${variantFilePath}`);
      
      // If variant doesn't exist, generate it
      if (!(await this.fileExists(variantFilePath))) {
        console.log(`[getFileStream] Generating ${variant} variant...`);
        try {
          await this.generateImageVariant(fileRecord, variant);
          console.log(`[getFileStream] Successfully generated ${variant} variant`);
        } catch (error) {
          console.error(`[getFileStream] Error generating ${variant} variant:`, error);
          // Fall back to original if variant generation fails
          console.log(`[getFileStream] Falling back to original file`);
          filePath = originalFilePath;
        }
      } else {
        filePath = variantFilePath;
        // Update content type for WebP files
        if (useWebP) {
          contentType = 'image/webp';
        }
      }
    }

    console.log(`[getFileStream] Final file path: ${filePath}`);
    
    if (!(await this.fileExists(filePath))) {
      const errorMsg = `File not found at path: ${filePath}`;
      console.error(`[getFileStream] ${errorMsg}`);
      
      // Check if the file exists in a different location (for debugging)
      const possiblePaths = [
        path.join(this.storagePath, fileRecord.storagePath),
        path.join(this.storagePath, 'originals', fileRecord.storagePath),
        path.join(process.cwd(), 'public', fileRecord.storagePath),
      ];
      
      for (const p of possiblePaths) {
        const exists = await this.fileExists(p);
        console.log(`[getFileStream] Check path ${p}: ${exists ? 'EXISTS' : 'NOT FOUND'}`);
      }
      
      throw new NotFoundException('File not found on disk');
    }

    console.log(`[getFileStream] Successfully located file at: ${filePath}`);

    // Return the file stream, file record, and content type
    return {
      stream: createReadStream(filePath),
      file: fileRecord,
      contentType: contentType,
      filePath: filePath,
    };
  }

  async getFileUrl(id: string, variant: ImageVariant = ImageVariant.ORIGINAL): Promise<string> {
    const fileRecord = await this.fileRepository.findOne({ where: { id } });
    if (!fileRecord) {
      throw new NotFoundException('File not found');
    }

    const baseUrl = `${this.baseUrl}/files/${id}`;
    
    if (variant === ImageVariant.ORIGINAL) {
      return baseUrl;
    }

    // For thumbnails, we'll serve WebP format
    const format = variant === ImageVariant.THUMBNAIL ? 'webp' : undefined;
    const variantUrl = `${baseUrl}?variant=${variant}${format ? '&format=webp' : ''}`;
    
    return variantUrl;
  }

  private getVariantPath(fileRecord: FileRecord, variant: ImageVariant): string {
    const ext = path.extname(fileRecord.storagePath);
    const baseName = path.basename(fileRecord.storagePath, ext);
    const dirName = path.dirname(fileRecord.storagePath);
    return path.join(dirName, `${baseName}_${variant}${variant === ImageVariant.THUMBNAIL ? '.webp' : ext}`);
  }

  private async generateImageVariant(
    fileRecord: FileRecord,
    variant: ImageVariant,
  ): Promise<void> {
    const originalPath = path.join(this.storagePath, 'originals', fileRecord.storagePath);
    const variantPath = this.getVariantPath(fileRecord, variant);
    const fullVariantPath = path.join(this.storagePath, 'processed', variantPath);

    await StorageUtils.ensureDirectoryExists(path.dirname(fullVariantPath));

    const dimensions = StorageUtils.getVariantDimensions(variant);
    
    // For thumbnails, use WebP with quality 75
    const isThumbnail = variant === ImageVariant.THUMBNAIL;
    const processed = await StorageUtils.processImage(
      await fs.readFile(originalPath),
      { 
        ...dimensions, 
        quality: isThumbnail ? 75 : 80,
        webp: isThumbnail // Convert to WebP for thumbnails
      },
    );

    // Update file extension to .webp for WebP files
    const outputPath = isThumbnail 
      ? fullVariantPath.replace(/\.(jpg|jpeg|png)$/i, '.webp')
      : fullVariantPath;

    await fs.writeFile(outputPath, processed.buffer);
  }

  async deleteFile(id: string): Promise<void> {
    const fileRecord = await this.fileRepository.findOne({ where: { id } });
    if (!fileRecord) {
      return;
    }

    try {
      // Delete original file
      const originalPath = path.join(this.storagePath, 'originals', fileRecord.storagePath);
      if (await this.fileExists(originalPath)) {
        await fs.unlink(originalPath);
      }

      // Delete processed variants if image
      if (FileUtils.isImageMimeType(fileRecord.mimeType)) {
        for (const variant of Object.values(ImageVariant)) {
          if (variant === ImageVariant.ORIGINAL) continue;
          
          const variantPath = path.join(
            this.storagePath,
            'processed',
            this.getVariantPath(fileRecord, variant as ImageVariant),
          );

          if (await this.fileExists(variantPath)) {
            await fs.unlink(variantPath).catch(() => { /* Ignore errors */ });
          }
        }
      }

      // Soft delete the record
      fileRecord.deletedAt = new Date();
      await this.fileRepository.save(fileRecord);
    } catch (error) {
      this.logger.error(`Failed to delete file ${id}: ${error.message}`, error.stack);
      throw new InternalServerErrorException('Failed to delete file');
    }
  }

  private async fileExists(filePath: string): Promise<boolean> {
    try {
      await fs.access(filePath);
      return true;
    } catch {
      return false;
    }
  }
}
