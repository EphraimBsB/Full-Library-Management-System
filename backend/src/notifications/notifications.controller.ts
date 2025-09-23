import { Controller, Get, Query, Post, Param } from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { GetUser } from '../auth/decorators/get-user.decorator';
import { User } from '../users/entities/user.entity';

@Controller('notifications')
export class NotificationsController {
  constructor(private readonly service: NotificationsService) {}

  @Get()
  async list(
    @GetUser() user: User,
    @Query('limit') limit = '20',
    @Query('offset') offset = '0',
  ) {
    const lim = Math.min(parseInt(limit as string, 10) || 20, 100);
    const off = parseInt(offset as string, 10) || 0;
    return this.service.listForUser(user.id, lim, off);
  }

  @Post(':id/read')
  async markRead(@GetUser() user: User, @Param('id') id: string) {
    return this.service.markRead(Number(id), user.id);
  }

  @Post('read-all')
  async markAllRead(@GetUser() user: User) {
    const affected = await this.service.markAllRead(user.id);
    return { affected };
  }

  @Get('unread-count')
  async getUnreadCount(@GetUser() user: User) {
    return this.service.getUnreadCount(user.id);
  }

  @Get('summary')
  async getSummary(@GetUser() user: User) {
    return this.service.getSummary(user.id, 10);
  }
}
