import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull } from 'typeorm';
import { Notification, NotificationType } from './entities/notification.entity';
import { NotificationsGateway } from './notifications.gateway';

interface CreateNotificationInput {
  userId: string;
  title: string;
  message: string;
  type?: NotificationType;
  data?: Record<string, any> | null;
}

@Injectable()
export class NotificationsService {
  constructor(
    @InjectRepository(Notification)
    private readonly repo: Repository<Notification>,
    private readonly gateway: NotificationsGateway,
  ) {}

  async create(input: CreateNotificationInput): Promise<Notification> {
    const notification = this.repo.create({
      userId: input.userId,
      title: input.title,
      message: input.message,
      type: input.type ?? NotificationType.GENERAL,
      data: input.data ?? null,
      readAt: null,
    });
    const saved = await this.repo.save(notification);

    // Push to client via websocket (room keyed by userId)
    this.gateway.emitToUser(input.userId, 'notification', saved);

    return saved;
  }

  async listForUser(userId: string, limit = 20, offset = 0): Promise<{ items: Notification[]; total: number }> {
    const [items, total] = await this.repo.findAndCount({
      where: { userId },
      order: { createdAt: 'DESC' },
      take: limit,
      skip: offset,
    });
    return { items, total };
  }

  async markRead(id: number, userId: string): Promise<Notification> {
    const notif = await this.repo.findOne({ where: { id, userId } });
    if (!notif) throw new NotFoundException('Notification not found');
    if (!notif.readAt) {
      notif.readAt = new Date();
      await this.repo.save(notif);
    }
    return notif;
  }

  async markAllRead(userId: string): Promise<number> {
    const res = await this.repo.createQueryBuilder()
      .update(Notification)
      .set({ readAt: () => 'CURRENT_TIMESTAMP' })
      .where('userId = :userId', { userId })
      .andWhere('readAt IS NULL')
      .execute();
    return res.affected ?? 0;
  }

  async getUnreadCount(userId: string): Promise<{ count: number }> {
    const count = await this.repo.count({ where: { userId, readAt: IsNull() } });
    return { count };
  }

  async listLatest(userId: string, limit = 10): Promise<Notification[]> {
    return this.repo.find({ where: { userId }, order: { createdAt: 'DESC' }, take: limit });
  }

  async getSummary(userId: string, limit = 10): Promise<{ unreadCount: number; latest: Notification[] }> {
    const [{ count }, latest] = await Promise.all([
      this.getUnreadCount(userId),
      this.listLatest(userId, limit),
    ]);
    return { unreadCount: count, latest };
  }
}
