import * as crypto from 'crypto';
import * as mime from 'mime-types';
import { STORAGE_CONSTANTS } from '../storage.constants';
import { FileMetadata } from '../interfaces/file-metadata.interface';

export class FileUtils {
  static async calculateChecksum(buffer: Buffer): Promise<string> {
    return new Promise((resolve) => {
      const hash = crypto.createHash('sha256');
      hash.update(buffer);
      resolve(hash.digest('hex'));
    });
  }

  static async getFileMetadata(filePath: string): Promise<FileMetadata> {
    const fs = await import('fs/promises');
    const stats = await fs.stat(filePath);
    return {
      size: stats.size,
      mimeType: mime.lookup(filePath) || 'application/octet-stream',
    };
  }

  static validateMimeType(mimeType: string): boolean {
    return STORAGE_CONSTANTS.ALLOWED_MIME_TYPES.includes(mimeType);
  }

  static isImageMimeType(mimeType: string): boolean {
    return STORAGE_CONSTANTS.IMAGE_MIME_TYPES.includes(mimeType);
  }

  static generateUniqueFilename(originalName: string): string {
    const ext = this.getFileExtension(originalName);
    const baseName = originalName.substring(0, originalName.lastIndexOf('.')) || originalName;
    const uniqueId = crypto.randomBytes(4).toString('hex');
    return `${baseName}-${uniqueId}${ext ? `.${ext}` : ''}`.toLowerCase();
  }

  private static getFileExtension(filename: string): string {
    return filename.split('.').pop()?.toLowerCase() || '';
  }
}
