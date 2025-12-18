// src/data-import/data-import.service.ts
import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import * as XLSX from 'xlsx';
import { BooksService } from '../books/books.service';
import { CreateBookDto } from '../books/dto/create-book.dto';
import { ImportResultDto, ImportSummaryDto } from './dto/import-result.dto';
import { validate } from 'class-validator';
import { plainToInstance } from 'class-transformer';

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const SUPPORTED_MIME_TYPES = [
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-excel',
];

@Injectable()
export class DataImportService {
  private readonly logger = new Logger(DataImportService.name);
  private readonly BATCH_SIZE = 50;

  constructor(private readonly booksService: BooksService) {}

  async validateFile(file: any): Promise<void> {
    if (!file) {
      throw new BadRequestException('No file uploaded');
    }

    if (file.size > MAX_FILE_SIZE) {
      throw new BadRequestException(`File too large. Maximum size is ${MAX_FILE_SIZE / 1024 / 1024}MB`);
    }

    if (!SUPPORTED_MIME_TYPES.includes(file.mimetype)) {
      throw new BadRequestException(
        `Unsupported file type. Supported types: ${SUPPORTED_MIME_TYPES.join(', ')}`
      );
    }
  }

  private findHeaderRow(rows: any[][]): number {
    const headerKeywords = ['title', 'author', 'isbn', 'publication', 'call', 'category', 'year'];
    for (let r = 0; r < Math.min(rows.length, 10); r++) {
      const row = rows[r] || [];
      const joined = row.join(' ').toLowerCase();
      if (headerKeywords.some(k => joined.includes(k))) {
        return r;
      }
    }
    return 0;
  }

  private validateRequiredFields(row: Record<string, any>): string[] {
    const errors: string[] = [];
    if (!row.title) errors.push('Title is required');
    if (!row.author) errors.push('Author is required');
    return errors;
  }

  private async validateBookData(dto: Partial<CreateBookDto>): Promise<string[]> {
    const errors: string[] = [];
    
    if (!dto.title?.trim()) errors.push('Title is required');
    if (!dto.author?.trim()) errors.push('Author is required');
    
    if (dto.isbn) {
      const isbn = dto.isbn.replace(/[\s-]/g, '');
      if (isbn.length !== 10 && isbn.length !== 13) {
        errors.push('ISBN must be 10 or 13 digits');
      }
    }

    if (dto.publicationYear) {
      const year = Number(dto.publicationYear);
      if (isNaN(year) || year < 1000 || year > new Date().getFullYear() + 1) {
        errors.push('Invalid publication year');
      }
    }

    if (dto.totalCopies !== undefined && (isNaN(dto.totalCopies) || dto.totalCopies < 0)) {
      errors.push('Total copies must be a non-negative number');
    }

    return errors;
  }

  async importBooksFromExcel(buffer: Buffer): Promise<ImportSummaryDto> {
    const startTime = Date.now();
    const results: ImportResultDto[] = [];
    const errors: string[] = [];
    const warnings: string[] = [];

    try {
      const workbook = XLSX.read(buffer, { type: 'buffer' });
      const sheetName = workbook.SheetNames[0];
      const sheet = workbook.Sheets[sheetName];
      const rawRows: any[][] = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' });

      if (rawRows.length <= 1) {
        warnings.push('The Excel file is empty or contains no data');
        return this.buildSummary(results, errors, warnings, startTime);
      }

      const headerIndex = this.findHeaderRow(rawRows);
      const headerRow = rawRows[headerIndex] || [];
      const headersByIndex = this.normalizeHeaders(headerRow);
      const totalRows = rawRows.length - (headerIndex + 1);

      for (let i = 0; i < totalRows; i += this.BATCH_SIZE) {
        const batchResults = await this.processBatch(
          rawRows,
          headerIndex + 1 + i,
          Math.min(this.BATCH_SIZE, totalRows - i),
          headersByIndex,
          headerRow
        );
        results.push(...batchResults);
      }

    } catch (error) {
      this.logger.error(`Import failed: ${error.message}`, error.stack);
      errors.push(`Import failed: ${error.message}`);
    }

    return this.buildSummary(results, errors, warnings, startTime);
  }

  private async processBatch(
    rawRows: any[][],
    startRow: number,
    batchSize: number,
    headersByIndex: string[],
    headerRow: any[]
  ): Promise<ImportResultDto[]> {
    const batchResults: ImportResultDto[] = [];

    for (let i = 0; i < batchSize; i++) {
      const rowIndex = startRow + i;
      if (rowIndex >= rawRows.length) break;

      const rowArr = rawRows[rowIndex] || [];
      const rowNumber = rowIndex + 1;

      if (rowArr.every(cell => cell === '' || cell === null || cell === undefined)) {
        continue;
      }

      const rowObj = this.buildRowObject(rowArr, headersByIndex, headerRow);
      const result: ImportResultDto = {
        row: rowNumber,
        title: this.getCellValue(rowObj, ['title', 'Book Title', 'booktitle']),
        success: false,
        errors: [],
        data: { ...rowObj }
      };

      try {
        const requiredErrors = this.validateRequiredFields(rowObj);
        if (requiredErrors.length > 0) {
          result.errors = requiredErrors;
          batchResults.push(result);
          continue;
        }

        const dto = this.mapRowToCreateDto(rowObj);
        const validationErrors = await this.validateBookData(dto);
        
        if (validationErrors.length > 0) {
          result.errors = validationErrors;
          batchResults.push(result);
          continue;
        }

        const created = await this.booksService.create(dto as CreateBookDto);
        result.success = true;
        result.createdId = created.id;

      } catch (error) {
        this.logger.warn(`Failed to import row ${rowNumber}: ${error?.message}`, error?.stack);
        result.errors = [error?.message || 'Unknown error during import'];
      }

      batchResults.push(result);
    }

    return batchResults;
  }

  private buildRowObject(rowArr: any[], headersByIndex: string[], headerRow: any[]): Record<string, any> {
    const rowObj: Record<string, any> = {};
    
    for (let c = 0; c < rowArr.length; c++) {
      const key = headersByIndex[c];
      if (key) {
        rowObj[key] = rowArr[c];
      } else {
        const orig = (headerRow[c] || '').toString();
        if (orig) rowObj[orig] = rowArr[c];
      }
    }
    
    return rowObj;
  }

  private getCellValue(row: Record<string, any>, possibleKeys: string[]): string | undefined {
    for (const key of possibleKeys) {
      if (row[key] !== undefined && row[key] !== null && row[key] !== '') {
        return String(row[key]).trim();
      }
    }
    return undefined;
  }

  private normalizeHeaders(headerRow: any[]): string[] {
    return headerRow.map((h: any) => {
      if (!h) return '';
      const s = h.toString().toLowerCase().replace(/[^a-z0-9]/g, '');
      
      const headerMap: Record<string, string> = {
        title: 'title',
        author: 'author',
        isbn: 'isbn',
        publisher: 'publisher',
        year: 'publicationYear',
        call: 'callNo',
        category: 'category',
        stock: 'stock',
        edition: 'edition',
        description: 'description',
        location: 'location',
        shelf: 'shelf',
        price: 'price',
        type: 'type',
        source: 'source',
        ddc: 'ddc'
      };

      for (const [key, value] of Object.entries(headerMap)) {
        if (s.includes(key)) return value;
      }
      
      return '';
    });
  }

  private buildSummary(
    results: ImportResultDto[],
    errors: string[],
    warnings: string[],
    startTime: number
  ): ImportSummaryDto {
    const imported = results.filter(r => r.success).length;
    const failed = results.length - imported;
    const duration = Date.now() - startTime;

    const failedResults = results.filter(r => !r.success);
    if (failedResults.length > 0) {
      const errorSummary = failedResults
        .map(r => `Row ${r.row} (${r.title || 'No title'}): ${r.errors?.join('; ')}`)
        .join('\n');
      errors.push(`Failed to import ${failed} rows. Details:\n${errorSummary}`);
    }

    return {
      total: results.length,
      imported,
      failed,
      results,
      errors,
      warnings,
      duration,
      timestamp: new Date()
    };
  }

  private mapRowToCreateDto(row: any): Partial<CreateBookDto> {
    const findCell = (aliases: string[]): any => {
      if (!row) return '';
      
      const keys = Object.keys(row);
      for (const alias of aliases) {
        const normalizedAlias = alias.toLowerCase().replace(/[^a-z0-9]/g, '');
        for (const key of keys) {
          const normalizedKey = key.toString().toLowerCase().replace(/[^a-z0-9]/g, '');
          if (normalizedKey === normalizedAlias) {
            const value = row[key];
            return value !== undefined && value !== null ? value : '';
          }
        }
      }
      return '';
    };

    const title = findCell(['title', 'booktitle', 'titleofthebook']);
    const author = findCell(['author', 'bookauthor']);
    const isbn = findCell(['isbn']);
    const publisher = findCell(['publisher', 'publication', 'bookpublication']);
    const year = findCell(['publicationyear', 'year', 'yearofpub', 'pubyear']);
    const category = findCell(['category', 'categories']);
    const actualStock = findCell(['actualstock', 'stock', 'actual']);
    const currentStock = findCell(['currentstock', 'current']);
    const callNo = findCell(['callno', 'callnumber', 'call']);
    const edition = findCell(['edition']);
    const description = findCell(['description', 'desc']);
    const location = findCell(['location']);
    const shelf = findCell(['shelf', 'shelflocation']);
    const price = findCell(['price', 'cost']);
    const type = findCell(['type', 'booktype']);
    const source = findCell(['source', 'acquiredfrom']);
    const ddc = findCell(['ddc', 'dewey', 'deweydecimal']);

    const categories = (category || '').toString()
      .split(',')
      .map((s: string) => ({ name: s.trim() }))
      .filter((c: { name: string }) => c.name);

    const totalCopiesValue = actualStock || currentStock;
    const totalCopies = totalCopiesValue ? Number(totalCopiesValue) : 1;

    const copies = Array.from({ length: totalCopies }, (_, i) => ({
      accessNumber: String(i + 1).padStart(3, '0')
    }));

    return {
      title: title ? String(title).trim() : '',
      author: author ? String(author).trim() : '',
      isbn: isbn ? String(isbn).trim() : undefined,
      publisher: publisher ? String(publisher).trim() : undefined,
      publicationYear: year ? Number(year) : undefined,
      edition: edition ? String(edition).trim() : undefined,
      totalCopies,
      description: description ? String(description).trim() : undefined,
      coverImageUrl: undefined,
      categories: categories.length ? categories : [{ name: 'General' }],
      subjects: [],
      typeId: type ? Number(type) : 1,
      sourceId: source ? Number(source) : undefined,
      ddc: ddc ? String(ddc).trim() : (callNo ? String(callNo).trim() : undefined),
      price: price ? String(price) : undefined,
      ebookUrl: undefined,
      location: location ? String(location).trim() : undefined,
      shelf: shelf ? String(shelf).trim() : undefined,
      copies,
      rating: 0,
    };
  }
}