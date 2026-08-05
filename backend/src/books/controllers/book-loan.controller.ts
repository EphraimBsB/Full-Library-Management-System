import {
  Controller,
  Post,
  Body,
  UseGuards,
  Req,
  Get,
  Param,
  Delete,
  Query,
  Put,
  NotFoundException,
} from '@nestjs/common';
import { BookLoanService } from '../services/book-loan.service';
import { UsersService } from '../../users/users.service';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { UserRole } from 'src/common/enums/user-role.enum';
import { CreateLoanDto } from '../dto/create-loan.dto';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
  ApiQuery,
} from '@nestjs/swagger';
import { LoanStatus } from '../entities/book-loan.entity';
import { DataSource } from 'typeorm';
import { PaginatedResponseDto } from '../../common/dto/paginated-response.dto';
import { PaginationOptions } from '../../common/interfaces/pagination-options.interface';
import { IssueBookToUserDto } from '../dto/issue-book-to-user.dto';

@Controller('loans')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiTags('book-loans')
export class BookLoanController {
  constructor(
    private readonly bookLoanService: BookLoanService,
    private readonly usersService: UsersService,
    private dataSource: DataSource,
  ) {}

  @Get()
  @Roles(UserRole.LIBRARIAN, UserRole.ADMIN)
  @ApiOperation({ summary: 'Get all book loans with optional filters' })
  @ApiBearerAuth()
  @ApiQuery({ name: 'status', required: false, enum: LoanStatus })
  @ApiQuery({ name: 'userId', required: false })
  @ApiQuery({ name: 'bookId', required: false })
  @ApiResponse({ status: 200, description: 'Returns paginated book loans' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  async findAll(
    @Query('status') status?: LoanStatus,
    @Query('userId') userId?: string,
    @Query('bookId') bookId?: string,
    @Query('page') page = 1,
    @Query('limit') limit = 10,
  ): Promise<PaginatedResponseDto<any>> {
    return this.bookLoanService.findAll({
      status,
      userId,
      bookId,
      page,
      limit,
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
  @ApiResponse({
    status: 409,
    description: 'Book not available or already borrowed',
  })
  async create(@Body() createLoanDto: CreateLoanDto, @Req() req: any) {
    const userId = req.user.id;
    return this.bookLoanService.createLoan(this.dataSource.manager, {
      ...createLoanDto,
      userId,
    });
  }

  @Post('issue-to-user')
  @Roles(UserRole.LIBRARIAN, UserRole.ADMIN)
  @ApiOperation({ summary: 'Issue a book to a specific user by roll number' })
  @ApiBearerAuth()
  @ApiResponse({ status: 201, description: 'Book issued successfully' })
  @ApiResponse({
    status: 400,
    description: 'Bad request - Invalid data or member issues',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({
    status: 403,
    description:
      'Forbidden - Member has reached loan limit or no active membership',
  })
  @ApiResponse({ status: 404, description: 'User or book not found' })
  @ApiResponse({
    status: 409,
    description: 'Book not available or already borrowed by user',
  })
  async issueToUser(@Body() issueBookDto: IssueBookToUserDto): Promise<any> {
    try {
      return await this.dataSource.transaction(async (manager) => {
        // 1. Find user by roll number
        const user = await this.usersService.findByRollNumber(
          issueBookDto.rollNumber,
        );
        if (!user) {
          throw new NotFoundException(
            `User with roll number ${issueBookDto.rollNumber} not found`,
          );
        }

        // 2. Create loan using existing service within transaction
        return this.bookLoanService.createLoan(manager, {
          bookId: issueBookDto.bookId,
          preferredCopyId: issueBookDto.accessNumber,
          userId: user.id,
        });
      });
    } catch (error) {
      // Re-throw known exceptions to be handled by global filter
      throw error;
    }
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
  async returnBook(@Param('loanId') loanId: string, @Req() req: any) {
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
  async renewLoan(@Param('loanId') loanId: string, @Req() req: any) {
    const userId = req.user.id;
    return this.bookLoanService.renewLoan(loanId, userId);
  }

  @Post('mark-lost/:loanId')
  @Roles(UserRole.LIBRARIAN, UserRole.ADMIN)
  @ApiOperation({ summary: 'Mark a book loan as lost' })
  @ApiBearerAuth()
  @ApiResponse({ status: 200, description: 'Loan marked as lost successfully' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Loan not found' })
  @ApiResponse({ status: 409, description: 'Cannot mark loan as lost' })
  async markLoanAsLost(
    @Param('loanId') loanId: string,
    @Body() body: { notes?: string },
    @Req() req: any,
  ) {
    const markedById = req.user.id;
    return this.bookLoanService.markLoanAsLost(loanId, markedById, body.notes);
  }

  @Get('my-loans')
  @Roles(UserRole.MEMBER, UserRole.LIBRARIAN, UserRole.ADMIN)
  @ApiOperation({ summary: 'Get all active loans for the current user' })
  @ApiBearerAuth()
  @ApiResponse({
    status: 200,
    description: "Returns list of user's active loans",
  })
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
        processed: {
          type: 'number',
          description: 'Number of successfully processed loans',
        },
        errors: { type: 'number', description: 'Number of errors encountered' },
      },
    },
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
  async getLoan(@Param('id') id: string, @Req() req: any) {
    const userId = req.user.id;
    const loan = await this.bookLoanService.getBookLoan(id);

    // Only allow the borrower or admin to view the loan
    if (
      loan.user.id !== userId &&
      !req.user.roles.includes(UserRole.ADMIN) &&
      !req.user.roles.includes(UserRole.LIBRARIAN)
    ) {
      throw new Error('Forbidden');
    }

    return loan;
  }
}
