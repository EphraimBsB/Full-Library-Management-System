import { Controller, Get, Post, Delete, Param, UseGuards, Req, Query } from '@nestjs/common';
import { QueueService } from '../services/queue.service';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { UserRole } from 'src/common/enums/user-role.enum';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';

@ApiTags('queue')
@Controller('queue')
@UseGuards(JwtAuthGuard, RolesGuard)
export class QueueController {
  constructor(private readonly queueService: QueueService) {}

  @Post('book/:bookId')
  @Roles(UserRole.MEMBER, UserRole.LIBRARIAN, UserRole.ADMIN)
  @ApiOperation({ summary: 'Join the queue for a book' })
  @ApiBearerAuth()
  @ApiResponse({ status: 201, description: 'Successfully joined the queue' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Book not found' })
  @ApiResponse({ status: 409, description: 'Already in queue for this book' })
  async joinQueue(
    @Param('bookId') bookId: string,
    @Req() req: any,
  ) {
    const userId = req.user.id;
    return this.queueService.addToQueue(bookId, userId);
  }

  @Delete('entry/:entryId')
  @Roles(UserRole.MEMBER, UserRole.LIBRARIAN, UserRole.ADMIN)
  @ApiOperation({ summary: 'Leave the queue' })
  @ApiBearerAuth()
  @ApiResponse({ status: 200, description: 'Successfully left the queue' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Queue entry not found' })
  @ApiResponse({ status: 409, description: 'Cannot leave queue in current state' })
  async leaveQueue(
    @Param('entryId') entryId: string,
    @Req() req: any,
  ) {
    const userId = req.user.id;
    return this.queueService.cancelQueueEntry(entryId, userId);
  }

  @Get('book/:bookId/position')
  @Roles(UserRole.MEMBER, UserRole.LIBRARIAN, UserRole.ADMIN)
  @ApiOperation({ summary: 'Get queue position for a book' })
  @ApiBearerAuth()
  @ApiResponse({ status: 200, description: 'Returns queue position' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Queue entry not found' })
  async getQueuePosition(
    @Param('bookId') bookId: string,
    @Req() req: any,
  ) {
    const userId = req.user.id;
    // In a real app, you'd need to find the entry ID first
    const entry = await this.queueService.getUserQueues(userId);
    const userEntry = entry.find(e => e.book.id.toString() === bookId);
    
    if (!userEntry) {
      return { position: 0, total: 0 };
    }
    
    return this.queueService.getQueuePosition(userEntry.id);
  }

  @Get('book/:bookId')
  @Roles(UserRole.LIBRARIAN, UserRole.ADMIN)
  @ApiOperation({ summary: 'Get queue for a book (admin only)' })
  @ApiBearerAuth()
  @ApiResponse({ status: 200, description: 'Returns the queue for a book' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  getBookQueue(@Param('bookId') bookId: string) {
    return this.queueService.getBookQueue(bookId);
  }

  @Get('my-queues')
  @Roles(UserRole.MEMBER, UserRole.LIBRARIAN, UserRole.ADMIN)
  @ApiOperation({ summary: 'Get all queues the user is in' })
  @ApiBearerAuth()
  @ApiResponse({ status: 200, description: 'Returns list of user\'s queue entries' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  getMyQueues(@Req() req: any) {
    const userId = req.user.id;
    return this.queueService.getUserQueues(userId);
  }

  @Post('entry/:entryId/pickup')
  @Roles(UserRole.LIBRARIAN, UserRole.ADMIN)
  @ApiOperation({ summary: 'Mark a book as picked up from queue' })
  @ApiBearerAuth()
  @ApiResponse({ status: 200, description: 'Successfully marked as picked up' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Queue entry not found' })
  @ApiResponse({ status: 409, description: 'Book is not ready for pickup' })
  async markAsPickedUp(@Param('entryId') entryId: string) {
    return this.queueService.markAsPicked(entryId);
  }
}
