import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull } from 'typeorm';
import * as path from 'path';
import * as fs from 'fs/promises';
import { FileRecord } from './entities/file-record.entity';

@Injectable()
export class StorageSyncService {
  private readonly logger = new Logger(StorageSyncService.name);
  private readonly storagePath: string;

  constructor(
    @InjectRepository(FileRecord)
    private readonly fileRepository: Repository<FileRecord>,
    private readonly configService: ConfigService,
  ) {
    this.storagePath =
      this.configService.get<string>('STORAGE_PATH') || './storage';
  }

  async syncOrphanedFiles(): Promise<{
    foundFiles: number;
    syncedFiles: number;
    errors: string[];
  }> {
    const errors: string[] = [];
    let foundFiles = 0;
    let syncedFiles = 0;

    try {
      const originalsPath = path.join(this.storagePath, 'originals');

      // Scan all files in the originals directory
      const allFiles = await this.scanDirectory(originalsPath);
      foundFiles = allFiles.length;

      this.logger.log(`Found ${foundFiles} files in storage`);

      for (const filePath of allFiles) {
        try {
          // Extract relative path from storage
          const relativePath = path.relative(originalsPath, filePath);

          // Check if file already exists in database
          const existingRecord = await this.fileRepository.findOne({
            where: { storagePath: relativePath, deletedAt: IsNull() },
          });

          if (!existingRecord) {
            // Get file stats
            const stats = await fs.stat(filePath);
            const fileName = path.basename(filePath);

            // Try to determine MIME type
            let mimeType = 'application/octet-stream';
            try {
              const fileExtension = path.extname(fileName).toLowerCase();
              // Basic MIME type mapping
              const mimeTypes: Record<string, string> = {
                '.pdf': 'application/pdf',
                '.png': 'image/png',
                '.jpg': 'image/jpeg',
                '.jpeg': 'image/jpeg',
                '.gif': 'image/gif',
                '.webp': 'image/webp',
                '.txt': 'text/plain',
                '.doc': 'application/msword',
                '.docx':
                  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
                '.xls': 'application/vnd.ms-excel',
                '.xlsx':
                  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                '.ppt': 'application/vnd.ms-powerpoint',
                '.pptx':
                  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
                '.epub': 'application/epub+zip',
                '.mobi': 'application/x-mobipocket-ebook',
                '.azw': 'application/vnd.amazon.ebook',
              };
              mimeType = mimeTypes[fileExtension] || mimeType;
            } catch (error) {
              this.logger.warn(`Could not determine MIME type for ${fileName}`);
            }

            // Extract user ID from path
            const pathParts = relativePath.split(path.sep);
            let userId = 'unknown';

            // Find UUID in path (user ID)
            const uuidPattern =
              /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
            for (const part of pathParts) {
              if (uuidPattern.test(part)) {
                userId = part;
                break;
              }
            }

            // Create database record
            const fileRecord = this.fileRepository.create({
              originalName: fileName,
              storagePath: relativePath,
              mimeType,
              size: stats.size,
              userId,
              isPublic: false,
              metadata: {
                syncedAt: new Date(),
                originalPath: filePath,
              },
            });

            await this.fileRepository.save(fileRecord);
            syncedFiles++;

            this.logger.log(`Synced file: ${fileName} (User: ${userId})`);
          }
        } catch (error) {
          const errorMsg = `Failed to sync file ${filePath}: ${error.message}`;
          errors.push(errorMsg);
          this.logger.error(errorMsg);
        }
      }
    } catch (error) {
      errors.push(`Failed to scan storage directory: ${error.message}`);
      this.logger.error(`Failed to scan storage directory: ${error.message}`);
    }

    return {
      foundFiles,
      syncedFiles,
      errors,
    };
  }

  private async scanDirectory(dirPath: string): Promise<string[]> {
    const files: string[] = [];

    try {
      const entries = await fs.readdir(dirPath, { withFileTypes: true });

      for (const entry of entries) {
        const fullPath = path.join(dirPath, entry.name);

        if (entry.isDirectory()) {
          // Recursively scan subdirectories
          const subFiles = await this.scanDirectory(fullPath);
          files.push(...subFiles);
        } else if (entry.isFile()) {
          // Add file to list
          files.push(fullPath);
        }
      }
    } catch (error) {
      this.logger.error(
        `Failed to read directory ${dirPath}: ${error.message}`,
      );
    }

    return files;
  }

  async getStorageSyncStatus(): Promise<{
    totalFilesInStorage: number;
    totalFilesInDatabase: number;
    orphanedFiles: number;
    storageSize: number;
  }> {
    try {
      // Count files in storage
      const originalsPath = path.join(this.storagePath, 'originals');
      const storageFiles = await this.scanDirectory(originalsPath);
      const totalFilesInStorage = storageFiles.length;

      // Calculate total storage size
      let storageSize = 0;
      for (const filePath of storageFiles) {
        try {
          const stats = await fs.stat(filePath);
          storageSize += stats.size;
        } catch (error) {
          // Skip files that can't be accessed
        }
      }

      // Count files in database
      const totalFilesInDatabase = await this.fileRepository.count({
        where: { deletedAt: IsNull() },
      });

      // Calculate orphaned files
      const orphanedFiles = Math.max(
        0,
        totalFilesInStorage - totalFilesInDatabase,
      );

      return {
        totalFilesInStorage,
        totalFilesInDatabase,
        orphanedFiles,
        storageSize,
      };
    } catch (error) {
      this.logger.error(`Failed to get storage sync status: ${error.message}`);
      return {
        totalFilesInStorage: 0,
        totalFilesInDatabase: 0,
        orphanedFiles: 0,
        storageSize: 0,
      };
    }
  }
}
