import * as path from 'path';
import sharp from 'sharp';
import { ProcessedFile } from '../interfaces/file-metadata.interface';
import { ImageVariant } from '../file-type.enum';
import * as fs from 'fs/promises';

export class StorageUtils {
  static async ensureDirectoryExists(dirPath: string): Promise<void> {
    try {
      await fs.access(dirPath);
    } catch {
      await fs.mkdir(dirPath, { recursive: true });
    }
  }

  static async processImage(
    buffer: Buffer,
    options: {
      width?: number;
      height?: number;
      quality?: number;
      format?: keyof sharp.FormatEnum;
      /** Whether to convert to WebP format */
      webp?: boolean;
    } = {},
  ): Promise<ProcessedFile> {
    try {
      let image = sharp(buffer);
      const metadata = await image.metadata();

      // Apply transformations
      if (options.width || options.height) {
        image = image.resize(options.width, options.height, {
          fit: 'inside',
          withoutEnlargement: true,
        });
      }

      const outputOptions = {
        quality: options.quality || 80,
        progressive: true,
      };

      // Convert to WebP if requested, otherwise use specified format or original
      if (options.webp) {
        image = image.webp({
          ...outputOptions,
          effort: 6, // Higher number = better compression (slower)
          alphaQuality: 80, // Quality of alpha channel
        });
      } else if (options.format) {
        image = image.toFormat(options.format, outputOptions);
      }

      const processedBuffer = await image.toBuffer();
      
      return {
        buffer: processedBuffer,
        metadata: {
          width: metadata.width,
          height: metadata.height,
          format: options.format || metadata.format,
          size: processedBuffer.length,
        },
      };
    } catch (error) {
      throw new Error(`Image processing failed: ${error.message}`);
    }
  }

  static getVariantDimensions(
    variant: ImageVariant,
  ): { width?: number; height?: number } {
    switch (variant) {
      case ImageVariant.THUMBNAIL:
        return { width: 200, height: 200 };
      case ImageVariant.MEDIUM:
        return { width: 800, height: 800 };
      case ImageVariant.LARGE:
        return { width: 1200, height: 1200 };
      case ImageVariant.ORIGINAL:
      default:
        return {};
    }
  }
}
