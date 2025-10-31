import { 
  Controller, 
  Post, 
  Body, 
  Param, 
  Get, 
  Query, 
  ParseUUIDPipe, 
  UseGuards, 
  Request,
  Delete
} from '@nestjs/common';
import { getSchemaPath } from '@nestjs/swagger';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { InhouseUsageService } from '../services/inhouse-usage.service';
import { 
  StartInhouseUsageDto, 
  InhouseUsageResponseDto 
} from '../dto/inhouse-usage.dto';
import { InhouseUsageStatus } from '../entities/book-inhouse-usage.entity';
import { UserRole } from 'src/common/enums/user-role.enum';

@ApiTags('books')
@Controller('books')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
export class InhouseUsageController {
  constructor(private readonly inhouseUsageService: InhouseUsageService) {}

  @Post('inhouse-usage/start')
  @Roles(UserRole.STUDENT, UserRole.FACULTY, UserRole.ADMIN)
  @ApiOperation({ summary: 'Start tracking in-house book usage' })
  @ApiResponse({ status: 201, description: 'In-house usage started', type: InhouseUsageResponseDto })
  async startUsage(
    @Request() req,
    @Body() startUsageDto: StartInhouseUsageDto,
  ): Promise<InhouseUsageResponseDto> {
    return this.inhouseUsageService.startUsage(req.user.id, startUsageDto);
  }

  @Post('inhouse-usage/:id/end')
  @Roles(UserRole.STUDENT, UserRole.FACULTY, UserRole.ADMIN)
  @ApiOperation({ summary: 'End an active in-house book usage session' })
  @ApiResponse({ status: 200, description: 'In-house usage ended', type: InhouseUsageResponseDto })
  async endUsage(
    @Request() req,
    @Param('id', ParseUUIDPipe) usageId: string,
  ): Promise<InhouseUsageResponseDto> {
    return this.inhouseUsageService.endUsage(usageId, req.user.id);
  }

  // @Delete(':id')
  // @Roles(UserRole.ADMIN, UserRole.LIBRARIAN)
  // @ApiOperation({ summary: 'Cancel an in-house usage session (Admin/Librarian only)' })
  // @ApiResponse({ status: 200, description: 'The usage has been cancelled', type: InhouseUsageResponseDto })
  // @ApiResponse({ status: 404, description: 'Usage not found' })
  // async cancelUsage(
  //   @Param('id') id: string,
  //   @Request() req,
  // ): Promise<InhouseUsageResponseDto> {
  //   return this.inhouseUsageService.cancelUsage(id, req.user.id);
  // }

  @Post('inhouse-usage/:id/force-end')
  @Roles(UserRole.ADMIN, UserRole.LIBRARIAN)
  @ApiOperation({ summary: 'Force end an active in-house usage session (Admin/Librarian only)' })
  @ApiResponse({ status: 200, description: 'The usage has been force ended', type: InhouseUsageResponseDto })
  @ApiResponse({ status: 404, description: 'Usage not found' })
  @ApiResponse({ status: 400, description: 'Usage is not active' })
  async forceEndUsage(
    @Param('id') id: string,
    @Request() req,
  ): Promise<InhouseUsageResponseDto> {
    return this.inhouseUsageService.endUsage(id, req.user.id, true);
  }

  @Get('inhouse-usage/all')
  @Roles(UserRole.ADMIN, UserRole.LIBRARIAN)
  @ApiOperation({ summary: 'Get all in-house usage sessions' })
  @ApiResponse({ 
    status: 200, 
    description: 'Paginated list of all in-house usages',
    schema: {
      type: 'object',
      properties: {
        items: { type: 'array', items: { $ref: getSchemaPath(InhouseUsageResponseDto) } },
        total: { type: 'number' }
      }
    }
  })
  async getAllUsages(
    @Query('limit') limit: number = 50,
    @Query('offset') offset: number = 0,
    @Query('status') status?: InhouseUsageStatus
  ) {
    return this.inhouseUsageService.getAllUsages(limit, offset, status);
  }

  @Get('inhouse-usage/active')
  @Roles(UserRole.STUDENT, UserRole.FACULTY, UserRole.ADMIN, UserRole.LIBRARIAN)
  @ApiOperation({ summary: 'Get active in-house usage sessions' })
  @ApiResponse({ status: 200, description: 'List of active in-house usages', type: [InhouseUsageResponseDto] })
  async getActiveUsages(
    @Request() req,
  ): Promise<InhouseUsageResponseDto[]> {
    return this.inhouseUsageService.getUserActiveUsages(req.user.id);
  }

  @Get('inhouse-usage/history')
  @Roles(UserRole.STUDENT, UserRole.FACULTY, UserRole.ADMIN, UserRole.LIBRARIAN)
  @ApiOperation({ summary: 'Get in-house usage history' })
  @ApiResponse({ status: 200, description: 'Paginated in-house usage history', type: [InhouseUsageResponseDto] })
  async getUsageHistory(
    @Request() req,
    @Query('limit') limit: number = 50,
    @Query('offset') offset: number = 0,
  ) {
    return this.inhouseUsageService.getUserUsageHistory(req.user.id, limit, offset);
  }

  @Delete('inhouse-usage/:id')
  @Roles(UserRole.ADMIN, UserRole.LIBRARIAN)
  @ApiOperation({ summary: 'Delete an in-house usage record (admin only)' })
  @ApiResponse({ status: 200, description: 'In-house usage record deleted' })
  async deleteUsage(
    @Param('id', ParseUUIDPipe) usageId: string,
  ): Promise<void> {
    await this.inhouseUsageService.deleteUsage(usageId);
  }
}
