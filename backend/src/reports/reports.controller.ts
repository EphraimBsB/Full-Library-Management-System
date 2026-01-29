import { Controller, Get, Res } from '@nestjs/common';
import type * as express from 'express';
import { ReportsService } from './reports.service';

@Controller('reports')
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Get('books/export')
  async exportBooks(@Res() res: express.Response) {
    const buffer = await this.reportsService.exportBooksToExcel();
    res.set({
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': 'attachment; filename="books_report.xlsx"',
      'Content-Length': buffer.length,
    });
    res.end(buffer);
  }

  @Get('loans/export')
  async exportLoans(@Res() res: express.Response) {
    const buffer = await this.reportsService.exportLoansToExcel();
    res.set({
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': 'attachment; filename="loans_report.xlsx"',
      'Content-Length': buffer.length,
    });
    res.end(buffer);
  }

  @Get('users/export')
  async exportUsers(@Res() res: express.Response) {
    const buffer = await this.reportsService.exportUsersToExcel();
    res.set({
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': 'attachment; filename="users_report.xlsx"',
      'Content-Length': buffer.length,
    });
    res.end(buffer);
  }
}
