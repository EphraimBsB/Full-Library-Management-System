import {
  Controller,
  Post,
  UploadedFile,
  UseInterceptors,
  Get,
  Param,
  Res,
  UseGuards,
  Query,
  Header,
  Req,
  BadRequestException,
  InternalServerErrorException,
  NotFoundException,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import type { Response, Request } from 'express';
import * as path from 'path';
import * as fs from 'fs';
import { StorageService } from './storage.service';
import { FileResponseDto } from './dto/file-response.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { User } from '../users/entities/user.entity';
import { GetUser } from '../auth/decorators/get-user.decorator';
import { Delete } from '@nestjs/common';
import { ImageVariant } from './file-type.enum';
import type { UploadedFile as UploadedFileType } from './interfaces/file-metadata.interface';
import { Public } from 'src/auth/decorators/public.decorator';


@Controller('files')
export class StorageController {
  constructor(private readonly storageService: StorageService) { }
  @Post('upload')
  @Public()
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(FileInterceptor('file'))
  async uploadFile(
    @UploadedFile() file: UploadedFileType,
    @GetUser() user?: User,
    @Req() req?: Request,
  ): Promise<FileResponseDto> {
    // Manually parse form data since we're bypassing DTO
    const formData = req?.body as Record<string, any> || {};
    const folder = formData?.folder || 'uploads';
    const isPublic = formData?.isPublic === 'true' || false;
    const generateThumbnail = formData?.generateThumbnail !== 'false'; // default true
    const userId = user?.id || 'guest';

    if (!file) {
      console.error('No file received in request');
      throw new BadRequestException('No file uploaded');
    }

    try {
      const fileRecord = await this.storageService.uploadFile(file, userId, {
        folder,
        isPublic,
        generateThumbnail,
      });
      return new FileResponseDto(fileRecord, this.storageService.getBaseUrl());
    } catch (error) {
      console.error('Error uploading file:', error);
      throw new InternalServerErrorException('Failed to upload file');
    }
  }

  @Get(':id')
  @Public()
  @HttpCode(HttpStatus.OK)
  @Header('Cache-Control', 'public, max-age=31536000')
  @Header('Access-Control-Allow-Origin', '*')
  @Header('Access-Control-Allow-Methods', 'GET, OPTIONS')
  @Header('Access-Control-Allow-Headers', 'Content-Type, Authorization')
  async getFile(
    @Param('id') id: string,
    @Res() res: Response,
    @Query('variant') variant?: ImageVariant,
    @Query('format') format?: 'webp' | 'original',
  ): Promise<void> {
    try {
      const targetVariant = variant || ImageVariant.THUMBNAIL;
      const targetFormat = format || (targetVariant === ImageVariant.THUMBNAIL ? 'webp' : 'original');

      let streamData;

      try {
        // Try to fetch the requested (or thumbnail) file
        streamData = await this.storageService.getFileStream(id, targetVariant, targetFormat);
      } catch (variantError) {
        if (targetVariant === ImageVariant.THUMBNAIL) {
          console.log('Thumbnail not found, falling back to original');
          streamData = await this.storageService.getFileStream(id, ImageVariant.ORIGINAL, 'original');
        } else {
          throw variantError;
        }
      }

      const { stream, file, contentType, filePath } = streamData;
      const stat = fs.statSync(filePath);

      res.set({
        'Content-Type': contentType,
        'Content-Length': stat.size,
        'Content-Disposition': `inline; filename="${path.basename(file.originalName)}"`,
        'Accept-Ranges': 'bytes',
        'Connection': 'keep-alive',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization, Range',
        'Access-Control-Expose-Headers': 'Content-Length, Content-Type',
      });

      // Pipe the file and handle errors
      stream.on('error', (err) => {
        console.error('[getFile] Stream error:', err);
        if (!res.headersSent) res.status(500).send('Error streaming file');
      });

      stream.on('end', () => {
        res.end(); // explicitly end
      });

      stream.pipe(res, { end: false });

    } catch (error) {
      console.error('Error retrieving file:', error);
      throw new NotFoundException('File not found');
    }
  }


  @Delete(':id')
  @Public()
  @UseGuards(JwtAuthGuard)
  async deleteFile(
    @Param('id') id: string,
    @GetUser() user: User,
  ): Promise<void> {
    try {
      await this.storageService.deleteFile(id);
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw new NotFoundException('File not found');
      }
      throw error;
    }
  }
}
