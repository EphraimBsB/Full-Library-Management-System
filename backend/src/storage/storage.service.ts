import {
  Injectable,
  Logger,
  NotFoundException,
  InternalServerErrorException,
  BadRequestException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull, SelectQueryBuilder } from 'typeorm';
import * as path from 'path';
import * as fs from 'fs/promises';
import { createReadStream } from 'fs';
import { FileRecord } from './entities/file-record.entity';
import { FileUtils } from './utils/file.utils';
import { StorageUtils } from './utils/storage.utils';
import {
  ProcessedFile,
  FileUploadOptions,
  UploadedFile,
} from './interfaces/file-metadata.interface';
import { STORAGE_CONSTANTS } from './storage.constants';
import { ImageVariant } from './file-type.enum';
import { FileManagementQueryDto, SortField, SortOrder } from './dto/file-management-query.dto';
import { UpdateFileDto } from './dto/update-file.dto';
import { User } from 'src/users/entities/user.entity';

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
    this.baseUrl = this.configService.get(
      'APP_URL',
      'http://localhost:3000/api/v1',
    );

    // Ensure directories exist
    this.ensureStorageStructure();
  }

  getBaseUrl(): string {
    return this.baseUrl;
  }

  private async ensureStorageStructure() {
    await StorageUtils.ensureDirectoryExists(this.storagePath);
    await StorageUtils.ensureDirectoryExists(this.tempPath);
    await StorageUtils.ensureDirectoryExists(
      path.join(this.storagePath, 'originals'),
    );
    await StorageUtils.ensureDirectoryExists(
      path.join(this.storagePath, 'processed'),
    );
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
      // Validate file size
      if (!FileUtils.validateFileSize(file.size)) {
        const maxSizeMB = FileUtils.getMaxFileSizeMB();
        const fileSizeMB = Math.round(file.size / (1024 * 1024));
        throw new BadRequestException(
          `File size ${fileSizeMB}MB exceeds maximum allowed size of ${maxSizeMB}MB`,
        );
      }

      // Validate file type
      if (!FileUtils.validateMimeType(file.mimetype)) {
        throw new BadRequestException(
          `File type ${file.mimetype} is not allowed`,
        );
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
      throw new InternalServerErrorException(
        `File upload failed: ${error.message}`,
      );
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
      this.logger.warn(
        `Image processing failed, using original: ${error.message}`,
      );
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
    format?: 'webp' | 'original',
  ): Promise<{
    stream: NodeJS.ReadableStream;
    file: FileRecord;
    contentType: string;
    filePath: string;
  }> {
    const fileRecord = await this.fileRepository.findOne({ where: { id } });
    if (!fileRecord) {
      throw new NotFoundException('File not found in database');
    }

    // The storagePath is relative to the storage directory
    // For original files, they are stored in the 'originals' directory
    const originalFilePath = path.join(
      this.storagePath,
      'originals',
      fileRecord.storagePath,
    );

    let filePath = originalFilePath;
    let contentType = fileRecord.mimeType;

    // For non-original variants of images, check if we need to generate them
    if (
      variant !== ImageVariant.ORIGINAL &&
      FileUtils.isImageMimeType(fileRecord.mimeType)
    ) {
      // If format is explicitly requested as webp, ensure we use the webp variant
      const useWebP = format === 'webp' || variant === ImageVariant.THUMBNAIL;
      const variantPath = this.getVariantPath(fileRecord, variant);
      const variantFilePath = path.join(
        this.storagePath,
        'processed',
        useWebP
          ? variantPath.replace(/\.(jpg|jpeg|png)$/i, '.webp')
          : variantPath,
      );

      // If variant doesn't exist, generate it
      if (!(await this.fileExists(variantFilePath))) {
        try {
          await this.generateImageVariant(fileRecord, variant);
        } catch (error) {
          // Fall back to original if variant generation fails
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

    if (!(await this.fileExists(filePath))) {
      const errorMsg = `File not found at path: ${filePath}`;

      // Check if the file exists in a different location (for debugging)
      const possiblePaths = [
        path.join(this.storagePath, fileRecord.storagePath),
        path.join(this.storagePath, 'originals', fileRecord.storagePath),
        path.join(process.cwd(), 'public', fileRecord.storagePath),
      ];

      for (const p of possiblePaths) {
        const exists = await this.fileExists(p);
      }

      throw new NotFoundException('File not found on disk');
    }

    // Return the file stream, file record, and content type
    return {
      stream: createReadStream(filePath),
      file: fileRecord,
      contentType: contentType,
      filePath: filePath,
    };
  }

  async getFileUrl(
    id: string,
    variant: ImageVariant = ImageVariant.ORIGINAL,
  ): Promise<string> {
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

  private getVariantPath(
    fileRecord: FileRecord,
    variant: ImageVariant,
  ): string {
    const ext = path.extname(fileRecord.storagePath);
    const baseName = path.basename(fileRecord.storagePath, ext);
    const dirName = path.dirname(fileRecord.storagePath);
    return path.join(
      dirName,
      `${baseName}_${variant}${variant === ImageVariant.THUMBNAIL ? '.webp' : ext}`,
    );
  }

  private async generateImageVariant(
    fileRecord: FileRecord,
    variant: ImageVariant,
  ): Promise<void> {
    const originalPath = path.join(
      this.storagePath,
      'originals',
      fileRecord.storagePath,
    );
    const variantPath = this.getVariantPath(fileRecord, variant);
    const fullVariantPath = path.join(
      this.storagePath,
      'processed',
      variantPath,
    );

    await StorageUtils.ensureDirectoryExists(path.dirname(fullVariantPath));

    const dimensions = StorageUtils.getVariantDimensions(variant);

    // For thumbnails, use WebP with quality 75
    const isThumbnail = variant === ImageVariant.THUMBNAIL;
    const processed = await StorageUtils.processImage(
      await fs.readFile(originalPath),
      {
        ...dimensions,
        quality: isThumbnail ? 75 : 80,
        webp: isThumbnail, // Convert to WebP for thumbnails
      },
    );

    // Update file extension to .webp for WebP files
    const outputPath = isThumbnail
      ? fullVariantPath.replace(/\.(jpg|jpeg|png)$/i, '.webp')
      : fullVariantPath;

    await fs.writeFile(outputPath, processed.buffer);
  }

  async deleteFile(id: string, user: User): Promise<void> {
    const fileRecord = await this.fileRepository.findOne({ where: { id } });
    if (!fileRecord) {
      return;
    }

    try {
      // Delete original file
      const originalPath = path.join(
        this.storagePath,
        'originals',
        fileRecord.storagePath,
      );
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
            await fs.unlink(variantPath).catch(() => {
              /* Ignore errors */
            });
          }
        }
      }

      // Soft delete the record
      fileRecord.deletedAt = new Date();
      await this.fileRepository.save(fileRecord);
    } catch (error) {
      this.logger.error(
        `Failed to delete file ${id}: ${error.message}`,
        error.stack,
      );
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

  // File Management Methods

  async getFilesWithFilters(query: FileManagementQueryDto): Promise<{
    data: FileRecord[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    const { page = 1, limit = 20, search, mimeType, isPublic, userId, sortBy = SortField.CREATED_AT, sortOrder = SortOrder.DESC } = query;
    
    const queryBuilder: SelectQueryBuilder<FileRecord> = this.fileRepository
      .createQueryBuilder('file')
      .where('file.deletedAt IS NULL');

    // Apply filters
    if (search) {
      queryBuilder.andWhere('file.originalName ILIKE :search', { search: `%${search}%` });
    }

    if (mimeType) {
      queryBuilder.andWhere('file.mimeType ILIKE :mimeType', { mimeType: `%${mimeType}%` });
    }

    if (isPublic !== undefined) {
      queryBuilder.andWhere('file.isPublic = :isPublic', { isPublic });
    }

    if (userId) {
      queryBuilder.andWhere('file.userId = :userId', { userId });
    }

    // Apply sorting
    const sortField = sortBy as keyof FileRecord;
    queryBuilder.orderBy(`file.${sortField}`, sortOrder);

    // Get total count
    const total = await queryBuilder.getCount();

    // Apply pagination
    const skip = (page - 1) * limit;
    const data = await queryBuilder.skip(skip).take(limit).getMany();

    const totalPages = Math.ceil(total / limit);

    return {
      data,
      total,
      page,
      limit,
      totalPages,
    };
  }

  async getStorageStats(userId?: string): Promise<{
    totalFiles: number;
    totalSize: number;
    sizeByType: Record<string, number>;
    recentUploads: FileRecord[];
    storageUsage: {
      used: number;
      available: number;
      percentage: number;
    };
  }> {
    const queryBuilder = this.fileRepository
      .createQueryBuilder('file')
      .where('file.deletedAt IS NULL');

    if (userId) {
      queryBuilder.andWhere('file.userId = :userId', { userId });
    }

    // Get total files and size
    const stats = await queryBuilder
      .select('COUNT(*)', 'totalFiles')
      .addSelect('SUM(file.size)', 'totalSize')
      .getRawOne();

    const totalFiles = parseInt(stats.totalFiles) || 0;
    const totalSize = parseInt(stats.totalSize) || 0;

    // Get size by type
    const sizeByTypeQuery = this.fileRepository
      .createQueryBuilder('file')
      .where('file.deletedAt IS NULL');

    if (userId) {
      sizeByTypeQuery.andWhere('file.userId = :userId', { userId });
    }

    const sizeByTypeRaw = await sizeByTypeQuery
      .select('file.mimeType', 'mimeType')
      .addSelect('SUM(file.size)', 'size')
      .groupBy('file.mimeType')
      .getRawMany();

    const sizeByType = sizeByTypeRaw.reduce((acc, item) => {
      const type = item.mimeType.split('/')[0] || 'other';
      acc[type] = (acc[type] || 0) + parseInt(item.size) || 0;
      return acc;
    }, {});

    // Get recent uploads
    const recentUploadsQuery = this.fileRepository
      .createQueryBuilder('file')
      .where('file.deletedAt IS NULL');

    if (userId) {
      recentUploadsQuery.andWhere('file.userId = :userId', { userId });
    }

    const recentUploads = await recentUploadsQuery
      .orderBy('file.createdAt', 'DESC')
      .limit(5)
      .getMany();

    // Calculate storage usage (assuming 10GB limit)
    const maxStorage = 10 * 1024 * 1024 * 1024; // 10GB in bytes
    const percentage = (totalSize / maxStorage) * 100;

    return {
      totalFiles,
      totalSize,
      sizeByType,
      recentUploads,
      storageUsage: {
        used: totalSize,
        available: Math.max(0, maxStorage - totalSize),
        percentage: Math.min(100, percentage),
      },
    };
  }

  async getFileById(id: string): Promise<FileRecord> {
    const file = await this.fileRepository.findOne({
      where: { id, deletedAt: IsNull() },
    });

    if (!file) {
      throw new NotFoundException('File not found');
    }

    // Add URL to the response
    file.url = file.getUrl(this.getBaseUrl());
    return file;
  }

  async updateFile(id: string, updateFileDto: UpdateFileDto): Promise<FileRecord> {
    const file = await this.getFileById(id);

    if (updateFileDto.originalName) {
      file.originalName = updateFileDto.originalName;
    }

    if (updateFileDto.isPublic !== undefined) {
      file.isPublic = updateFileDto.isPublic;
    }

    const updatedFile = await this.fileRepository.save(file);
    updatedFile.url = updatedFile.getUrl(this.getBaseUrl());
    return updatedFile;
  }

  async cleanupOrphanedFiles(): Promise<{
    message: string;
    deletedCount: number;
    freedSpace: number;
  }> {
    const queryBuilder = this.fileRepository
      .createQueryBuilder('file')
      .where('file.deletedAt IS NOT NULL');

    const orphanedFiles = await queryBuilder.getMany();
    let deletedCount = 0;
    let freedSpace = 0;

    for (const file of orphanedFiles) {
      try {
        // Delete physical files
        const originalPath = path.join(
          this.storagePath,
          'originals',
          file.storagePath,
        );

        if (await this.fileExists(originalPath)) {
          const stats = await fs.stat(originalPath);
          freedSpace += stats.size;
          await fs.unlink(originalPath);
        }

        // Delete processed variants if image
        if (FileUtils.isImageMimeType(file.mimeType)) {
          for (const variant of Object.values(ImageVariant)) {
            if (variant === ImageVariant.ORIGINAL) continue;

            const variantPath = path.join(
              this.storagePath,
              'processed',
              this.getVariantPath(file, variant as ImageVariant),
            );

            if (await this.fileExists(variantPath)) {
              await fs.unlink(variantPath).catch(() => {
                /* Ignore errors */
              });
            }
          }
        }

        // Hard delete the record
        await this.fileRepository.remove(file);
        deletedCount++;
      } catch (error) {
        this.logger.error(`Failed to cleanup file ${file.id}: ${error.message}`);
      }
    }

    return {
      message: 'Cleanup completed successfully',
      deletedCount,
      freedSpace,
    };
  }
}
