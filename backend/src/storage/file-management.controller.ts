import {
  Controller,
  Get,
  Query,
  UseGuards,
  BadRequestException,
  NotFoundException,
  Delete,
  Param,
  Post,
  Body,
  Patch,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { GetUser } from '../auth/decorators/get-user.decorator';
import { User } from '../users/entities/user.entity';
import { StorageService } from './storage.service';
import { StorageSyncService } from './storage-sync.service';
import { FileRecord } from './entities/file-record.entity';
import { FileManagementQueryDto } from './dto/file-management-query.dto';
import { BatchDeleteDto } from './dto/batch-delete.dto';
import { UpdateFileDto } from './dto/update-file.dto';

@ApiTags('File Management')
@Controller('file-management')
export class FileManagementController {
  constructor(
    private readonly storageService: StorageService,
    private readonly storageSyncService: StorageSyncService
  ) {}

  @Get('sync-status')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Get storage sync status (admin only)' })
  @ApiResponse({ status: 200, description: 'Sync status retrieved successfully' })
  async getSyncStatus(@GetUser() user: User): Promise<{
    totalFilesInStorage: number;
    totalFilesInDatabase: number;
    orphanedFiles: number;
    storageSize: number;
  }> {
    if (user.role.name !== 'Admin') {
      throw new BadRequestException('Only administrators can view sync status');
    }

    return this.storageSyncService.getStorageSyncStatus();
  }

  @Get('stats')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Get file storage statistics' })
  @ApiResponse({ status: 200, description: 'Statistics retrieved successfully' })
  async getStorageStats(@GetUser() user: User): Promise<{
    totalFiles: number;
    totalSize: number;
    sizeByType: Record<string, number>;
    recentUploads: Array<{
      id: string;
      originalName: string;
      mimeType: string;
      size: number;
      createdAt: Date;
    }>;
  }> {
    // Non-admin users get only their own stats
    const userId = user.role.name === 'Admin' ? undefined : user.id;
    return this.storageService.getStorageStats(userId);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Get file by ID' })
  @ApiResponse({ status: 200, description: 'File retrieved successfully' })
  async getFileById(
    @Param('id') id: string,
    @GetUser() user: User,
  ): Promise<FileRecord> {
    // Prevent sync-status from being treated as an ID
    if (id === 'sync-status' || id === 'sync' || id === 'stats' || id === 'cleanup' || id === 'batch-delete') {
      throw new NotFoundException('Route not found');
    }

    const file = await this.storageService.getFileById(id);

    if (!file) {
      throw new NotFoundException('File not found');
    }

    // Non-admin users can only access their own files unless public
    if (user.role.name !== 'Admin' && file.userId !== user.id && !file.isPublic) {
      throw new NotFoundException('File not found');
    }

    return file;
  }

  @Post('sync')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Sync orphaned files (admin only)' })
  @ApiResponse({ status: 200, description: 'Files synced successfully' })
  async syncOrphanedFiles(@GetUser() user: User): Promise<{
    message: string;
    foundFiles: number;
    syncedFiles: number;
    errors: string[];
  }> {
    if (user.role.name !== 'Admin') {
      throw new BadRequestException('Only administrators can sync files');
    }

    const result = await this.storageSyncService.syncOrphanedFiles();
    
    return {
      message: `Sync completed: ${result.syncedFiles} of ${result.foundFiles} files synced to database`,
      ...result,
    };
  }

  @Post('batch-delete')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Delete multiple files' })
  @ApiResponse({ status: 200, description: 'Files deleted successfully' })
  async batchDeleteFiles(
    @Body() body: BatchDeleteDto,
    @GetUser() user: User,
  ): Promise<{
    success: boolean;
    deletedCount: number;
    errors: string[];
  }> {
    const { fileIds } = body;
    const errors: string[] = [];
    let deletedCount = 0;

    for (const fileId of fileIds) {
      try {
        const file = await this.storageService.getFileById(fileId);

        if (!file) {
          errors.push(`File ${fileId} not found`);
          continue;
        }

        // Non-admin users can only delete their own files
        if (user.role.name !== 'Admin' && file.userId !== user.id) {
          errors.push(`Access denied for file ${fileId}`);
          continue;
        }

        await this.storageService.deleteFile(fileId, user);
        deletedCount++;
      } catch (error) {
        errors.push(`Failed to delete file ${fileId}: ${error.message}`);
      }
    }

    return {
      success: deletedCount > 0,
      deletedCount,
      errors,
    };
  }

  @Post('cleanup')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Clean up orphaned files (admin only)' })
  @ApiResponse({ status: 200, description: 'Cleanup completed successfully' })
  async cleanupOrphanedFiles(@GetUser() user: User): Promise<{
    message: string;
    deletedCount: number;
    freedSpace: number;
  }> {
    if (user.role.name !== 'Admin') {
      throw new BadRequestException('Only administrators can perform cleanup');
    }

    return this.storageService.cleanupOrphanedFiles();
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Get all files with filtering and pagination' })
  @ApiResponse({ status: 200, description: 'Files retrieved successfully' })
  @ApiQuery({ name: 'page', required: false, type: Number, description: 'Page number (default: 1)' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Items per page (default: 20)' })
  @ApiQuery({ name: 'search', required: false, type: String, description: 'Search by filename' })
  @ApiQuery({ name: 'mimeType', required: false, type: String, description: 'Filter by MIME type' })
  @ApiQuery({ name: 'isPublic', required: false, type: Boolean, description: 'Filter by public status' })
  @ApiQuery({ name: 'userId', required: false, type: String, description: 'Filter by user ID (admin only)' })
  @ApiQuery({ name: 'sortBy', required: false, type: String, description: 'Sort by field (createdAt, size, originalName)' })
  @ApiQuery({ name: 'sortOrder', required: false, type: String, description: 'Sort order (ASC, DESC)' })
  async getFiles(
    @Query() query: FileManagementQueryDto,
    @GetUser() user: User,
  ): Promise<{
    data: FileRecord[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    // Non-admin users can only see their own files
    if (user.role.name !== 'Admin') {
      query.userId = user.id;
    }

    return this.storageService.getFilesWithFilters(query);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update file metadata' })
  @ApiResponse({ status: 200, description: 'File updated successfully' })
  @ApiResponse({ status: 404, description: 'File not found' })
  async updateFile(
    @Param('id') id: string,
    @Body() updateFileDto: UpdateFileDto,
    @GetUser() user: User,
  ): Promise<FileRecord> {
    const file = await this.storageService.getFileById(id);
    
    if (!file) {
      throw new NotFoundException('File not found');
    }

    // Non-admin users can only update their own files
    if (user.role.name !== 'Admin' && file.userId !== user.id) {
      throw new NotFoundException('File not found');
    }

    return this.storageService.updateFile(id, updateFileDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a file' })
  @ApiResponse({ status: 200, description: 'File deleted successfully' })
  @ApiResponse({ status: 404, description: 'File not found' })
  async deleteFile(
    @Param('id') id: string,
    @GetUser() user: User,
  ): Promise<{ message: string }> {
    const file = await this.storageService.getFileById(id);
    
    if (!file) {
      throw new NotFoundException('File not found');
    }

    // Non-admin users can only delete their own files
    if (user.role.name !== 'Admin' && file.userId !== user.id) {
      throw new NotFoundException('File not found');
    }

    await this.storageService.deleteFile(id, user);
    return { message: 'File deleted successfully' };
  }
}
