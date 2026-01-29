// src/data-import/data-import.controller.ts
import {
  Controller,
  Post,
  UploadedFile,
  UseInterceptors,
  UseGuards,
  BadRequestException,
  HttpStatus,
  HttpException,
  Request,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { DataImportService } from './data-import.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import {
  ApiTags,
  ApiOperation,
  ApiBody,
  ApiConsumes,
  ApiResponse,
} from '@nestjs/swagger';
import { ImportSummaryDto } from './dto/import-result.dto';
import { diskStorage } from 'multer';
import { extname } from 'path';
import * as fs from 'fs';
import * as os from 'os';

const editFileName = (req, file, callback) => {
  const fileExtName = extname(file.originalname);
  const randomName = Array(32)
    .fill(null)
    .map(() => Math.round(Math.random() * 16).toString(16))
    .join('');
  callback(null, `${randomName}${fileExtName}`);
};

const tempDir = os.tmpdir();
if (!fs.existsSync(tempDir)) {
  fs.mkdirSync(tempDir, { recursive: true });
}

@ApiTags('data-import')
@Controller('data-import')
export class DataImportController {
  constructor(private readonly dataImportService: DataImportService) {}

  @Post('books/excel')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: tempDir,
        filename: editFileName,
      }),
      limits: {
        fileSize: 10 * 1024 * 1024, // 10MB
      },
      fileFilter: (req, file, callback) => {
        if (!file.originalname.match(/\.(xlsx|xls)$/)) {
          return callback(new Error('Only Excel files are allowed!'), false);
        }
        callback(null, true);
      },
    }),
  )
  @ApiOperation({
    summary: 'Import books from Excel file',
    description:
      'Upload an Excel file to import books into the system. The first row should contain headers.',
  })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    description: 'Excel file (.xlsx, .xls) with book data',
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
        },
      },
    },
  })
  @ApiResponse({
    status: 201,
    description: 'Books imported successfully',
    type: ImportSummaryDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid file format or validation error',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
  })
  @ApiResponse({
    status: 500,
    description: 'Internal server error',
  })
  async importBooks(
    @UploadedFile() file: Express.Multer.File,
    @Request() req,
  ) {
    if (!file) {
      throw new BadRequestException('No file uploaded or invalid file format');
    }

    try {
      const fileBuffer = fs.readFileSync(file.path);
      const result = await this.dataImportService.importBooksFromExcel(
        fileBuffer,
        req.user.id,
      );
      return result;
    } catch (error) {
      throw new HttpException(
        {
          status: HttpStatus.INTERNAL_SERVER_ERROR,
          error: 'Error processing file',
          message: error.message,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    } finally {
      // Clean up the temp file
      if (file?.path && fs.existsSync(file.path)) {
        try {
          fs.unlinkSync(file.path);
        } catch (e) {
          console.error('Error deleting temp file:', e);
        }
      }
    }
  }
}
