import { 
  Controller, 
  Post, 
  Body, 
  Get, 
  UseGuards, 
  Request, 
  Query, 
  Param, 
  Put, 
  NotFoundException, 
  BadRequestException, 
  ConflictException 
} from '@nestjs/common';
import { 
  ApiTags, 
  ApiOperation, 
  ApiResponse, 
  ApiBearerAuth 
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../common/enums/user-role.enum';
import { MembershipRequestService } from './membership-request.service';
import { CreateMembershipRequestDto } from './dto/create-membership-request.dto';
import { ProcessMembershipRequestDto } from './dto/process-membership-request.dto';
import { MembershipRequestStatus } from './entities/membership-request.entity';
import { Public } from '../auth/decorators/public.decorator';

@ApiTags('membership-requests')
@Controller('membership-requests')
export class MembershipRequestController {
  constructor(private readonly membershipRequestService: MembershipRequestService) {}

  @Post()
  @Public()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Create a new membership request' })
  @ApiResponse({ status: 201, description: 'Membership request created successfully' })
  @ApiResponse({ status: 400, description: 'Invalid request data' })
  @ApiResponse({ status: 404, description: 'Membership type not found' })
  @ApiResponse({ status: 409, description: 'Duplicate request exists' })
  async create(
    @Body() createMembershipRequestDto: CreateMembershipRequestDto,
  ) {
    try {
      const result = await this.membershipRequestService.createRequest(createMembershipRequestDto);
      return { 
        success: true, 
        message: 'Membership request created successfully',
        data: result 
      };
    } catch (error) {
      if (error instanceof NotFoundException || 
          error instanceof BadRequestException ||
          error instanceof ConflictException) {
        throw error;
      }
      console.error('Error creating membership request:', error);
      throw new BadRequestException({
        statusCode: 400,
        message: 'Failed to create membership request',
        error: 'Bad Request',
        details: error.message || 'An unknown error occurred'
      });
    }
  }

  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.LIBRARIAN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get all membership requests' })
  @ApiResponse({ status: 200, description: 'List of membership requests' })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin or Librarian role required' })
  async findAll(@Query('status') status?: MembershipRequestStatus) {
    try {
      const requests = await this.membershipRequestService.getAllRequests(status);
      return {
        success: true,
        data: requests,
        count: requests.length
      };
    } catch (error) {
      throw new BadRequestException('Failed to fetch membership requests');
    }
  }

  @Get('my-requests')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current user\'s membership requests' })
  @ApiResponse({ status: 200, description: 'List of user\'s membership requests' })
  async getUserRequests(@Request() req) {
    try {
      const requests = await this.membershipRequestService.getUserRequests(req.user.id);
      return {
        success: true,
        data: requests,
        count: requests.length
      };
    } catch (error) {
      throw new BadRequestException('Failed to fetch your membership requests');
    }
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.LIBRARIAN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get a specific membership request' })
  @ApiResponse({ status: 200, description: 'Membership request details' })
  @ApiResponse({ status: 404, description: 'Request not found' })
  async findOne(@Param('id') id: string) {
    try {
      const request = await this.membershipRequestService.getRequestById(id);
      return {
        success: true,
        data: request
      };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new BadRequestException('Failed to fetch membership request');
    }
  }

  @Put(':id/approve')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.LIBRARIAN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Approve a membership request' })
  @ApiResponse({ status: 200, description: 'Membership request approved successfully' })
  @ApiResponse({ status: 404, description: 'Request not found' })
  @ApiResponse({ status: 409, description: 'Request already processed' })
  async approveRequest(
    @Param('id') id: string,
    @Request() req,
  ) {
    try {
      const { request, user } = await this.membershipRequestService.approveRequest(id, req.user);
      
      return {
        success: true,
        message: 'Membership request approved successfully',
        data: {
          request,
          user: {
            id: user.id,
            email: user.email,
            isActive: user.isActive,
            role: user.role
          }
        }
      };
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof ConflictException) {
        throw error;
      }
      throw new BadRequestException('Failed to approve membership request');
    }
  }

  @Put(':id/reject')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.LIBRARIAN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Reject a membership request' })
  @ApiResponse({ status: 200, description: 'Membership request rejected successfully' })
  @ApiResponse({ status: 400, description: 'Reason is required for rejection' })
  @ApiResponse({ status: 404, description: 'Request not found' })
  @ApiResponse({ status: 409, description: 'Request already processed' })
  async rejectRequest(
    @Param('id') id: string,
    @Body() { reason }: ProcessMembershipRequestDto,
    @Request() req,
  ) {
    if (!reason) {
      throw new BadRequestException('Reason is required for rejection');
    }

    try {
      const { request, user } = await this.membershipRequestService.rejectRequest(id, req.user, reason);
      
      return {
        success: true,
        message: 'Membership request rejected successfully',
        data: {
          request,
          user: {
            id: user.id,
            email: user.email,
            isActive: user.isActive,
            role: user.role
          },
          rejectionReason: reason
        }
      };
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof ConflictException) {
        throw error;
      }
      throw new BadRequestException('Failed to reject membership request');
    }
  }
}
