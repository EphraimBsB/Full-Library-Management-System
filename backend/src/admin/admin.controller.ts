import { Controller, Get, Post, Query, UseGuards, Body } from '@nestjs/common';
import { AdminService } from './admin.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { UserRole } from '../common/enums/user-role.enum';

@ApiTags('Admin / System')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
@Controller('admin')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('health')
  @ApiOperation({ summary: 'Get system health metrics (Admin only)' })
  getSystemHealth() {
    return this.adminService.getSystemHealth();
  }

  @Get('logs')
  @ApiOperation({ summary: 'Get backend system logs (Admin only)' })
  async getLogs(
    @Query('type') type: 'error' | 'system' | 'combined',
    @Query('lines') lines?: string,
  ) {
    const numLines = lines ? parseInt(lines, 10) : 100;
    return this.adminService.getLogs(type || 'combined', numLines);
  }

  @Post('cache/clear')
  @ApiOperation({ summary: 'Clear system cache' })
  clearCache() {
    return this.adminService.clearCache();
  }

  @Get('queues')
  @ApiOperation({ summary: 'Get queue stats' })
  getQueueStats() {
    return this.adminService.getQueueStats();
  }

  @Get('db/stats')
  @ApiOperation({ summary: 'Get database stats' })
  getDbStats() {
    return this.adminService.getDbStats();
  }

  @Post('db/backup')
  @ApiOperation({ summary: 'Trigger manual database backup' })
  triggerBackup() {
    return this.adminService.triggerBackup();
  }

  @Get('backups')
  @ApiOperation({ summary: 'List available database backups' })
  listBackups() {
    return this.adminService.listBackups();
  }

  @Post('backups/restore')
  @ApiOperation({ summary: 'Restore database from a specific backup file' })
  restoreBackup(@Body('fileName') fileName: string) {
    if (!fileName) {
      return { success: false, message: 'File name is required.' };
    }
    return this.adminService.restoreBackup(fileName);
  }
}
