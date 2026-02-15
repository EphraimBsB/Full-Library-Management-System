// src/data-import/data-import.controller.ts
import {
  Controller,
  Post,
  Get,
  UploadedFile,
  UseInterceptors,
  UseGuards,
  BadRequestException,
  HttpStatus,
  HttpException,
  Request,
  Res,
  Sse,
  MessageEvent,
  Query,
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
import { Response } from 'express';
import type { Response as ExpressResponse } from 'express';
import * as XLSX from 'xlsx';
import { Observable, Subject } from 'rxjs';
import { map } from 'rxjs/operators';
import { JwtService } from '@nestjs/jwt';

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
  constructor(
    private readonly dataImportService: DataImportService,
    private readonly jwtService: JwtService,
  ) {}

  // Store active SSE connections
  private readonly activeConnections = new Map<string, Subject<MessageEvent>>();

  @Sse('import-progress')
  @ApiOperation({
    summary: 'Subscribe to import progress updates',
    description: 'Server-Sent Events endpoint for real-time import progress',
  })
  importProgress(@Request() req, @Query('token') token?: string): Observable<MessageEvent> {
    // Validate token from query parameter if not using JWT guard
    let userId: string;
    
    if (req.user) {
      // Using JWT guard - user is already authenticated
      userId = req.user.id;
    } else if (token) {
      // Using token from query parameter
      try {
        const payload = this.jwtService.verify(token);
        userId = payload.sub;
      } catch (error) {
        throw new BadRequestException('Invalid token');
      }
    } else {
      throw new BadRequestException('Authentication required');
    }

    const subject = new Subject<MessageEvent>();
    const connectionId = `${userId}-${Date.now()}`;
    
    // Store the connection
    this.activeConnections.set(connectionId, subject);
    
    // Send initial connection message
    subject.next({
      data: JSON.stringify({
        type: 'connected',
        message: 'Connected to import progress stream',
        timestamp: new Date(),
      }),
    });
    
    // Clean up on disconnect
    return new Observable(observer => {
      const subscription = subject.subscribe(observer);
      return () => {
        subscription.unsubscribe();
        this.activeConnections.delete(connectionId);
      };
    });
  }

  private sendProgressUpdate(userId: string, data: any) {
    // Find all connections for this user and send update
    for (const [connectionId, subject] of this.activeConnections.entries()) {
      if (connectionId.startsWith(userId)) {
        subject.next({
          data: JSON.stringify({
            ...data,
            timestamp: new Date(),
          }),
        });
      }
    }
  }

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
      // Send initial progress update
      this.sendProgressUpdate(req.user.id, {
        type: 'started',
        message: 'Starting import process...',
        progress: 0,
        totalRows: 0,
        currentRow: 0,
      });

      const fileBuffer = fs.readFileSync(file.path);
      
      // Create a progress callback
      const progressCallback = (progress: any) => {
        this.sendProgressUpdate(req.user.id, progress);
      };

      const result = await this.dataImportService.importBooksFromExcel(
        fileBuffer,
        req.user.id,
        progressCallback,
      );

      // Send final result
      this.sendProgressUpdate(req.user.id, {
        type: 'completed',
        message: 'Import completed successfully!',
        progress: 100,
        summary: result,
      });

      return result;
    } catch (error) {
      // Send error update
      this.sendProgressUpdate(req.user.id, {
        type: 'error',
        message: `Import failed: ${error.message}`,
        error: error.message,
      });

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

  @Get('template/books')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({
    summary: 'Download books import template',
    description: 'Download an Excel template with required columns for book import',
  })
  @ApiResponse({
    status: 200,
    description: 'Template downloaded successfully',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
  })
  async downloadBooksTemplate(@Res() res: ExpressResponse) {
    try {
      // Create template data
      const templateData = [
        {
          'Title': 'Sample Book Title',
          'Author': 'Author Name',
          'ISBN': '978-0123456789',
          'Publisher': 'Publisher Name',
          'Publication Year': '2023',
          'Edition': '1st Edition',
          'Category': 'Fiction, General',
          'Description': 'Book description goes here',
          'Total Copies': '5',
          'Available Copies': '5',
          'Call Number': 'FIC.123',
          'Location': 'Main Library',
          'Shelf': 'A1',
          'Price': '29.99',
          'Type': '1',
          'Source': '1',
          'DDC': '823.9',
        },
        {
          'Title': 'Another Book',
          'Author': 'Another Author',
          'ISBN': '978-0987654321',
          'Publisher': 'Another Publisher',
          'Publication Year': '2022',
          'Edition': '2nd Edition',
          'Category': 'Non-Fiction, Science',
          'Description': 'Another book description',
          'Total Copies': '3',
          'Available Copies': '3',
          'Call Number': 'SCI.456',
          'Location': 'Science Section',
          'Shelf': 'B2',
          'Price': '45.00',
          'Type': '1',
          'Source': '1',
          'DDC': '500',
        },
      ];

      // Create workbook
      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.json_to_sheet(templateData);

      // Set column widths
      const colWidths = [
        { wch: 20 }, // Title
        { wch: 15 }, // Author
        { wch: 15 }, // ISBN
        { wch: 15 }, // Publisher
        { wch: 12 }, // Publication Year
        { wch: 10 }, // Edition
        { wch: 20 }, // Category
        { wch: 30 }, // Description
        { wch: 12 }, // Total Copies
        { wch: 15 }, // Available Copies
        { wch: 12 }, // Call Number
        { wch: 12 }, // Location
        { wch: 8 },  // Shelf
        { wch: 8 },  // Price
        { wch: 5 },  // Type
        { wch: 5 },  // Source
        { wch: 8 },  // DDC
      ];
      ws['!cols'] = colWidths;

      XLSX.utils.book_append_sheet(wb, ws, 'Books Template');

      // Write to buffer
      const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });

      // Set headers
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', 'attachment; filename=books_import_template.xlsx');
      res.setHeader('Content-Length', buffer.length);

      // Send buffer
      res.send(buffer);
    } catch (error) {
      throw new HttpException(
        {
          status: HttpStatus.INTERNAL_SERVER_ERROR,
          error: 'Error generating template',
          message: error.message,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
