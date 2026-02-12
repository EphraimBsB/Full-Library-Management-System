import { Controller, Get, Res, UseGuards } from '@nestjs/common';
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

@Controller('reports')
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Get('books/export')
  @Public()
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
  @Public()
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
  @Public()
  async exportUsers(@Res() res: express.Response) {
    const buffer = await this.reportsService.exportUsersToExcel();
    res.set({
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': 'attachment; filename="users_report.xlsx"',
      'Content-Length': buffer.length,
    });
    res.end(buffer);
  }

  @Get('requests/export')
  @Roles(UserRole.ADMIN, UserRole.LIBRARIAN)
  async exportRequests(@Res() res: express.Response) {
    const buffer = await this.reportsService.exportRequestsToExcel();
    res.set({
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': 'attachment; filename="requests_report.xlsx"',
      'Content-Length': buffer.length,
    });
    res.end(buffer);
  }
}
