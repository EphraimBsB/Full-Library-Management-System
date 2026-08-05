import { Controller, Get, Res, UseGuards, Query } from '@nestjs/common';
import type * as express from 'express';
import { ReportsService } from './reports.service';
import { Book } from '../books/entities/book.entity';
import { BookLoan } from '../books/entities/book-loan.entity';
import { User } from '../users/entities/user.entity';
import { BookRequest } from '../books/entities/book-request.entity';
import { Roles } from '../auth/decorators/roles.decorator';
import { RolesGuard } from '../auth/guards/roles.guard';
import { UserRole } from '../common/enums/user-role.enum';
import { Public } from '../auth/decorators/public.decorator';
import { ExportQueryDto } from './dto/export-query.dto';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery } from '@nestjs/swagger';

@ApiTags('reports')
@Controller('reports')
@UseGuards(RolesGuard)
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Get('export/books')
  @Roles(UserRole.ADMIN, UserRole.LIBRARIAN)
  @ApiOperation({ summary: 'Export books data' })
  @ApiQuery({ name: 'format', required: false, enum: ['excel', 'csv', 'json'] })
  @ApiQuery({
    name: 'startDate',
    required: false,
    description: 'Start date (YYYY-MM-DD)',
  })
  @ApiQuery({
    name: 'endDate',
    required: false,
    description: 'End date (YYYY-MM-DD)',
  })
  @ApiQuery({ name: 'search', required: false, description: 'Search term' })
  async exportBooks(
    @Res() res: express.Response,
    @Query() query: ExportQueryDto,
  ) {
    const buffer = await this.reportsService.exportBooks(query);
    const filename = `books_export_${new Date().toISOString().split('T')[0]}.${query.format || 'xlsx'}`;

    res.set({
      'Content-Type': this.getContentType(query.format),
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Content-Length': buffer.length,
    });
    res.end(buffer);
  }

  @Get('export/users')
  @Roles(UserRole.ADMIN, UserRole.LIBRARIAN)
  @ApiOperation({ summary: 'Export users data' })
  @ApiQuery({ name: 'format', required: false, enum: ['excel', 'csv', 'json'] })
  @ApiQuery({
    name: 'startDate',
    required: false,
    description: 'Start date (YYYY-MM-DD)',
  })
  @ApiQuery({
    name: 'endDate',
    required: false,
    description: 'End date (YYYY-MM-DD)',
  })
  @ApiQuery({ name: 'search', required: false, description: 'Search term' })
  async exportUsers(
    @Res() res: express.Response,
    @Query() query: ExportQueryDto,
  ) {
    const buffer = await this.reportsService.exportUsers(query);
    const filename = `users_export_${new Date().toISOString().split('T')[0]}.${query.format || 'xlsx'}`;

    res.set({
      'Content-Type': this.getContentType(query.format),
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Content-Length': buffer.length,
    });
    res.end(buffer);
  }

  @Get('export/loans')
  @Roles(UserRole.ADMIN, UserRole.LIBRARIAN)
  @ApiOperation({ summary: 'Export loans data' })
  @ApiQuery({ name: 'format', required: false, enum: ['excel', 'csv', 'json'] })
  @ApiQuery({
    name: 'startDate',
    required: false,
    description: 'Start date (YYYY-MM-DD)',
  })
  @ApiQuery({
    name: 'endDate',
    required: false,
    description: 'End date (YYYY-MM-DD)',
  })
  @ApiQuery({ name: 'search', required: false, description: 'Search term' })
  async exportLoans(
    @Res() res: express.Response,
    @Query() query: ExportQueryDto,
  ) {
    const buffer = await this.reportsService.exportLoans(query);
    const filename = `loans_export_${new Date().toISOString().split('T')[0]}.${query.format || 'xlsx'}`;

    res.set({
      'Content-Type': this.getContentType(query.format),
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Content-Length': buffer.length,
    });
    res.end(buffer);
  }

  @Get('export/categories')
  @Roles(UserRole.ADMIN, UserRole.LIBRARIAN)
  @ApiOperation({ summary: 'Export categories data' })
  @ApiQuery({ name: 'format', required: false, enum: ['excel', 'csv', 'json'] })
  async exportCategories(
    @Res() res: express.Response,
    @Query() query: ExportQueryDto,
  ) {
    const buffer = await this.reportsService.exportCategories(query);
    const filename = `categories_export_${new Date().toISOString().split('T')[0]}.${query.format || 'xlsx'}`;

    res.set({
      'Content-Type': this.getContentType(query.format),
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Content-Length': buffer.length,
    });
    res.end(buffer);
  }

  @Get('export/subjects')
  @Roles(UserRole.ADMIN, UserRole.LIBRARIAN)
  @ApiOperation({ summary: 'Export subjects data' })
  @ApiQuery({ name: 'format', required: false, enum: ['excel', 'csv', 'json'] })
  async exportSubjects(
    @Res() res: express.Response,
    @Query() query: ExportQueryDto,
  ) {
    const buffer = await this.reportsService.exportSubjects(query);
    const filename = `subjects_export_${new Date().toISOString().split('T')[0]}.${query.format || 'xlsx'}`;

    res.set({
      'Content-Type': this.getContentType(query.format),
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Content-Length': buffer.length,
    });
    res.end(buffer);
  }

  @Get('export/publishers')
  @Roles(UserRole.ADMIN, UserRole.LIBRARIAN)
  @ApiOperation({ summary: 'Export publishers data' })
  @ApiQuery({ name: 'format', required: false, enum: ['excel', 'csv', 'json'] })
  async exportPublishers(
    @Res() res: express.Response,
    @Query() query: ExportQueryDto,
  ) {
    const buffer = await this.reportsService.exportPublishers(query);
    const filename = `publishers_export_${new Date().toISOString().split('T')[0]}.${query.format || 'xlsx'}`;

    res.set({
      'Content-Type': this.getContentType(query.format),
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Content-Length': buffer.length,
    });
    res.end(buffer);
  }

  private getContentType(format?: string): string {
    switch (format) {
      case 'csv':
        return 'text/csv';
      case 'json':
        return 'application/json';
      default:
        return 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
    }
  }
}
