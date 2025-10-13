import { Controller, Post, Body, UseGuards, Req, Get, Param, Delete, Query, Put } from '@nestjs/common';
import { BookLoanService } from '../services/book-loan.service';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { UserRole } from 'src/common/enums/user-role.enum';
import { CreateLoanDto } from '../dto/create-loan.dto';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags, ApiQuery } from '@nestjs/swagger';
import { LoanStatus } from '../entities/book-loan.entity';
import { DataSource } from 'typeorm';

@Controller('loans')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiTags('book-loans')
export class BookLoanController {
  constructor(private readonly bookLoanService: BookLoanService, private dataSource: DataSource) {}

  @Get()
  @Roles(UserRole.LIBRARIAN, UserRole.ADMIN)
  @ApiOperation({ summary: 'Get all book loans with optional filters' })
  @ApiBearerAuth()
  @ApiQuery({ name: 'status', required: false, enum: LoanStatus })
  @ApiQuery({ name: 'userId', required: false })
  @ApiQuery({ name: 'bookId', required: false })
  @ApiResponse({ status: 200, description: 'Returns all book loans' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  async findAll(
    @Query('status') status?: LoanStatus,
    @Query('userId') userId?: string,
    @Query('bookId') bookId?: string,
  ) {
    return this.bookLoanService.findAll({
      status,
      userId,
      bookId,
    });
  }

  @Post()
  @Roles(UserRole.MEMBER, UserRole.LIBRARIAN, UserRole.ADMIN)
  @ApiOperation({ summary: 'Create a new book loan' })
  @ApiBearerAuth()
  @ApiResponse({ status: 201, description: 'Book loan created successfully' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Book not found' })
  @ApiResponse({ status: 409, description: 'Book not available or already borrowed' })
  async create(
    @Body() createLoanDto: CreateLoanDto,
    @Req() req: any,
  ) {
    const userId = req.user.id;
    return this.bookLoanService.createLoan(this.dataSource.manager, {
      ...createLoanDto,
      userId
    });
  }

  @Post('return/:loanId')
  @Roles(UserRole.LIBRARIAN, UserRole.ADMIN)
  @ApiOperation({ summary: 'Return a borrowed book' })
  @ApiBearerAuth()
  @ApiResponse({ status: 200, description: 'Book returned successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Loan not found' })
  @ApiResponse({ status: 409, description: 'Book already returned' })
  async returnBook(
    @Param('loanId') loanId: string,
    @Req() req: any,
  ) {
    const returnedById = req.user.id;
    return this.bookLoanService.returnBook(loanId, returnedById);
  }

  @Post('renew/:loanId')
  @Roles(UserRole.MEMBER, UserRole.LIBRARIAN, UserRole.ADMIN)
  @ApiOperation({ summary: 'Renew a book loan' })
  @ApiBearerAuth()
  @ApiResponse({ status: 200, description: 'Loan renewed successfully' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Loan not found' })
  @ApiResponse({ status: 409, description: 'Cannot renew loan' })
  async renewLoan(
    @Param('loanId') loanId: string,
    @Req() req: any,
  ) {
    const userId = req.user.id;
    return this.bookLoanService.renewLoan(loanId, userId);
  }

  @Get('my-loans')
  @Roles(UserRole.MEMBER, UserRole.LIBRARIAN, UserRole.ADMIN)
  @ApiOperation({ summary: 'Get all active loans for the current user' })
  @ApiBearerAuth()
  @ApiResponse({ status: 200, description: 'Returns list of user\'s active loans' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getMyLoans(@Req() req: any) {
    const userId = req.user.id;
    return this.bookLoanService.getUserLoans(userId);
  }

  @Post('check-overdue')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Check and process all overdue loans (admin only)' })
  @ApiBearerAuth()
  @ApiResponse({ 
    status: 200, 
    description: 'Returns statistics about processed overdue loans',
    schema: {
      type: 'object',
      properties: {
        processed: { type: 'number', description: 'Number of successfully processed loans' },
        errors: { type: 'number', description: 'Number of errors encountered' }
      }
    }
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  async checkOverdueLoans() {
    return this.bookLoanService.checkOverdueLoans();
  }

  @Get('overdue')
  @Roles(UserRole.LIBRARIAN, UserRole.ADMIN)
  @ApiOperation({ summary: 'Get all overdue loans' })
  @ApiBearerAuth()
  @ApiResponse({ status: 200, description: 'List of overdue loans' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  async getOverdueLoans() {
    return this.bookLoanService.getOverdueLoans();
  }

  @Get(':id')
  @Roles(UserRole.MEMBER, UserRole.LIBRARIAN, UserRole.ADMIN)
  @ApiOperation({ summary: 'Get a specific loan' })
  @ApiBearerAuth()
  @ApiResponse({ status: 200, description: 'Returns the loan details' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Loan not found' })
  async getLoan(
    @Param('id') id: string,
    @Req() req: any,
  ) {
    const userId = req.user.id;
    const loan = await this.bookLoanService.getBookLoan(id);
    
    // Only allow the borrower or admin to view the loan
    if (loan.user.id !== userId && !req.user.roles.includes(UserRole.ADMIN) && !req.user.roles.includes(UserRole.LIBRARIAN)) {
      throw new Error('Forbidden');
    }
    
    return loan;
  }
}
