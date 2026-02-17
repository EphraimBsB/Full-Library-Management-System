import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  UseGuards,
  Query,
  Req,
} from '@nestjs/common';
import { BookRequestService } from '../services/book-request.service';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { UserRole } from 'src/common/enums/user-role.enum';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import {
  CreateBookRequestDto,
  ApproveRejectRequestDto,
} from '../dto/book-request.dto';
import { BookRequestStatus } from '../entities/book-request.entity';
import { CreateRenewalRequestDto, ApproveRejectRenewalDto } from '../dto/renewal-request.dto';

@ApiTags('book-requests')
@Controller('book-requests')
@UseGuards(JwtAuthGuard, RolesGuard)
export class BookRequestController {
  constructor(private readonly bookRequestService: BookRequestService) {}

  @Post()
  @Roles(UserRole.MEMBER, UserRole.LIBRARIAN, UserRole.ADMIN, UserRole.STUDENT, UserRole.FACULTY)
  @ApiOperation({ summary: 'Create a new book request' })
  @ApiBearerAuth()
  @ApiResponse({
    status: 201,
    description: 'Book request created successfully',
  })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Book not found' })
  @ApiResponse({ status: 409, description: 'Request already exists' })
  async create(
    @Body() createBookRequestDto: CreateBookRequestDto,
    @Req() req: any,
  ) {
    // In a real app, you'd get the user from the request
    const userId = req.user.id;
    return this.bookRequestService.createRequest(
      createBookRequestDto.bookId,
      userId,
      createBookRequestDto.reason,
    );
  }

  @Post(':id/approve')
  @Roles(UserRole.LIBRARIAN, UserRole.ADMIN)
  @ApiOperation({ summary: 'Approve a book request' })
  @ApiBearerAuth()
  @ApiResponse({ status: 200, description: 'Request approved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Request not found' })
  @ApiResponse({
    status: 409,
    description: 'Request is not in a pending state',
  })
  async approve(
    @Param('id') id: string,
    @Body() approveRequestDto: ApproveRejectRequestDto,
    @Req() req: any,
  ) {
    const approvedById = req.user.id;
    return this.bookRequestService.approveRequest(
      id,
      approvedById,
      approveRequestDto.preferredCopyId,
    );
  }

  @Post(':id/reject')
  @Roles(UserRole.LIBRARIAN, UserRole.ADMIN)
  @ApiOperation({ summary: 'Reject a book request' })
  @ApiBearerAuth()
  @ApiResponse({ status: 200, description: 'Request rejected successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Request not found' })
  @ApiResponse({
    status: 409,
    description: 'Request is not in a pending state',
  })
  async reject(
    @Param('id') id: string,
    @Body() rejectRequestDto: ApproveRejectRequestDto,
    @Req() req: any,
  ) {
    const rejectedById = req.user.id;
    return this.bookRequestService.rejectRequest(
      id,
      rejectRequestDto.notes || 'No reason provided',
      rejectedById,
    );
  }

  @Delete(':id')
  @Roles(UserRole.MEMBER, UserRole.LIBRARIAN, UserRole.ADMIN, UserRole.STUDENT, UserRole.FACULTY)
  @ApiOperation({ summary: 'Cancel a book request' })
  @ApiBearerAuth()
  @ApiResponse({ status: 200, description: 'Request cancelled successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Request not found' })
  @ApiResponse({
    status: 409,
    description: 'Only pending requests can be cancelled',
  })
  async remove(@Param('id') id: string, @Req() req: any) {
    return this.bookRequestService.cancelRequest(id, req.user.id);
  }

  @Get()
  @Roles(UserRole.LIBRARIAN, UserRole.ADMIN)
  @ApiOperation({
    summary: 'List all book requests with optional status filter',
  })
  @ApiBearerAuth()
  @ApiQuery({
    name: 'status',
    required: false,
    enum: BookRequestStatus,
    description: 'Filter requests by status',
  })
  @ApiResponse({ status: 200, description: 'List of book requests' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  async findAll(@Query('status') status?: BookRequestStatus) {
    return this.bookRequestService.findAll({ status });
  }

  @Get('my-requests')
  @Roles(UserRole.MEMBER, UserRole.LIBRARIAN, UserRole.ADMIN, UserRole.STUDENT, UserRole.FACULTY)
  @ApiOperation({ summary: 'Get my book requests' })
  @ApiBearerAuth()
  @ApiResponse({
    status: 200,
    description: "Returns list of user's book requests",
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getMyRequests(@Req() req: any) {
    const userId = req.user.id;
    return this.bookRequestService.getUserRequests(userId);
  }

  @Get('book/:bookId')
  @Roles(UserRole.LIBRARIAN, UserRole.ADMIN)
  @ApiOperation({ summary: 'Get all requests for a book' })
  @ApiBearerAuth()
  @ApiResponse({ status: 200, description: 'Returns list of book requests' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  getBookRequests(@Param('bookId') bookId: string) {
    return this.bookRequestService.getBookRequests(bookId);
  }

  @Get(':id')
  @Roles(UserRole.MEMBER, UserRole.LIBRARIAN, UserRole.ADMIN, UserRole.STUDENT, UserRole.FACULTY)
  @ApiOperation({ summary: 'Get a specific book request' })
  @ApiBearerAuth()
  @ApiResponse({ status: 200, description: 'Returns the book request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Request not found' })
  findOne(@Param('id') id: string) {
    return this.bookRequestService.getRequestById(id);
  }

  // Renewal Request Endpoints
  @Post('renewal')
  @Roles(UserRole.MEMBER, UserRole.STUDENT, UserRole.FACULTY, UserRole.ADMIN)
  @ApiOperation({ summary: 'Create a renewal request for an existing loan' })
  @ApiBearerAuth()
  @ApiResponse({ status: 201, description: 'Renewal request created successfully' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Loan not found' })
  @ApiResponse({ status: 409, description: 'Renewal request already exists or cannot be renewed' })
  async createRenewalRequest(
    @Body() createRenewalRequestDto: CreateRenewalRequestDto,
    @Req() req: any,
  ) {
    const userId = req.user.id;
    return this.bookRequestService.createRenewalRequest(
      createRenewalRequestDto.loanId,
      userId,
      createRenewalRequestDto.reason,
    );
  }

  @Get('renewal/all')
  @Roles(UserRole.LIBRARIAN, UserRole.ADMIN)
  @ApiOperation({ summary: 'Get all renewal requests' })
  @ApiBearerAuth()
  @ApiQuery({
    name: 'status',
    required: false,
    enum: BookRequestStatus,
    description: 'Filter renewal requests by status',
  })
  @ApiResponse({ status: 200, description: 'List of renewal requests' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  async getRenewalRequests(@Query('status') status?: BookRequestStatus) {
    return this.bookRequestService.findRenewalRequests(status);
  }

  @Post('renewal/:requestId/approve')
  @Roles(UserRole.LIBRARIAN, UserRole.ADMIN)
  @ApiOperation({ summary: 'Approve a renewal request' })
  @ApiBearerAuth()
  @ApiResponse({ status: 200, description: 'Renewal request approved and loan renewed' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Request not found' })
  @ApiResponse({ status: 409, description: 'Request cannot be approved' })
  async approveRenewalRequest(
    @Param('requestId') requestId: string,
    @Body() approveDto: ApproveRejectRenewalDto,
    @Req() req: any,
  ) {
    const approvedById = req.user.id;
    const updatedLoan = await this.bookRequestService.approveRenewalRequest(
      requestId, 
      approvedById, 
      approveDto.reason
    );
    
    return {
      message: 'Renewal request approved successfully',
      loan: updatedLoan,
      requestId: requestId
    };
  }

  @Post('renewal/:requestId/reject')
  @Roles(UserRole.LIBRARIAN, UserRole.ADMIN)
  @ApiOperation({ summary: 'Reject a renewal request' })
  @ApiBearerAuth()
  @ApiResponse({ status: 200, description: 'Renewal request rejected' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Request not found' })
  @ApiResponse({ status: 409, description: 'Request cannot be rejected' })
  async rejectRenewalRequest(
    @Param('requestId') requestId: string,
    @Body() rejectDto: ApproveRejectRenewalDto,
    @Req() req: any,
  ) {
    const rejectedById = req.user.id;
    return this.bookRequestService.rejectRenewalRequest(
      requestId,
      rejectedById,
      rejectDto.reason,
    );
  }
}
