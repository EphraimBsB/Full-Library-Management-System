import { Controller, Get, UseGuards, Request, Query, Post, Body, Param, ParseUUIDPipe, BadRequestException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../common/enums/user-role.enum';
import { MembershipService } from './membership.service';

@ApiTags('memberships')
@Controller('memberships')
export class MembershipController {
  constructor(private readonly membershipService: MembershipService) {}

  @Get()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get all memberships' })
  @ApiResponse({ status: 200, description: 'Get all memberships' })
  async getMemberships() {
    return this.membershipService.findAllMemberships();
  }

  @Get('types')
  @ApiOperation({ summary: 'Get all available membership types' })
  @ApiResponse({ status: 200, description: 'List of membership types' })
  async getMembershipTypes() {
    return this.membershipService.getMembershipTypes();
  }

  @Get('my-membership')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current user\'s active membership' })
  @ApiResponse({ status: 200, description: 'Current user\'s active membership' })
  async getMyMembership(@Request() req) {
    return this.membershipService.findActiveMembership(req.user.id);
  }

  @Get('can-borrow')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Check if user can borrow more books' })
  @ApiResponse({ status: 200, description: 'Borrowing status' })
  async canBorrowBooks(
    @Request() req,
    @Query('count') count: number = 1,
  ) {
    return this.membershipService.canBorrowBooks(req.user.id, count);
  }

  // @Post('renew/:id')
  // @UseGuards(JwtAuthGuard)
  // @ApiBearerAuth()
  // @ApiOperation({ summary: 'Renew a membership' })
  // @ApiResponse({ status: 200, description: 'Renewed membership' })
  // async renewMembership(
  //   @Param('id', ParseUUIDPipe) id: string,
  //   @Request() req,
  // ) {
  //   const membership = await this.membershipService.findMembershipById(id);
  //   if (membership.userId !== req.user.id) {
  //     throw new BadRequestException('You can only renew your own membership');
  //   }
  //   return this.membershipService.renewMembership(id, req.user.id);
  // }

  @Get('admin')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.LIBRARIAN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get all memberships (Admin/Librarian only)' })
  @ApiResponse({ status: 200, description: 'List of all memberships' })
  async getAllMemberships(
    @Query('status') status?: string,
    @Query('userId') userId?: string,
  ) {
    return this.membershipService.findAllMemberships(status, userId);
  }
}
