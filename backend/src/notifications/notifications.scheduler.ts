import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThanOrEqual, MoreThanOrEqual, Between } from 'typeorm';
import { BorrowedBook } from '../books/entities/borrowed-book.entity';
import { NotificationsService } from './notifications.service';
import { EmailService } from './email.service';
import { NotificationType } from './entities/notification.entity';

@Injectable()
export class NotificationsScheduler {
  private readonly logger = new Logger(NotificationsScheduler.name);

  constructor(
    @InjectRepository(BorrowedBook)
    private readonly borrowedRepo: Repository<BorrowedBook>,
    private readonly notifications: NotificationsService,
    private readonly email: EmailService,
  ) {}

  // Runs every day at 08:00 server time
  @Cron(CronExpression.EVERY_DAY_AT_8AM)
  async sendDueReminders() {
    const now = new Date();
    const in24h = new Date(now.getTime() + 24 * 60 * 60 * 1000);

    // Not returned and due within next 24h (reminder)
    const dueSoon = await this.borrowedRepo.find({
      where: {
        isReturned: false,
        dueDate: Between(now, in24h),
      },
      relations: ['book'],
    });

    for (const bb of dueSoon) {
      const title = 'Book Due Soon';
      const message = `The book "${bb.book?.title ?? 'Book'}" is due by ${bb.dueDate?.toDateString()}. Please return on time.`;

      await this.notifications.create({
        userId: bb.userId,
        title,
        message,
        type: NotificationType.BORROWED_BOOK_DUE,
        data: { bookId: bb.bookId, borrowedBookId: bb.id, dueDate: bb.dueDate },
      });

      if (this.email.isEnabled) {
        await this.email.sendToUser(
          bb.userId,
          title,
          message,
          this.email.basicHtml(title, message),
        );
      }
    }

    // Not returned and overdue
    const overdue = await this.borrowedRepo.find({
      where: {
        isReturned: false,
        dueDate: LessThanOrEqual(now),
      },
      relations: ['book'],
    });

    for (const bb of overdue) {
      const title = 'Book Overdue';
      const message = `The book "${bb.book?.title ?? 'Book'}" is overdue. Please return it as soon as possible.`;

      await this.notifications.create({
        userId: bb.userId,
        title,
        message,
        type: NotificationType.BORROWED_BOOK_DUE,
        data: { bookId: bb.bookId, borrowedBookId: bb.id, dueDate: bb.dueDate },
      });

      if (this.email.isEnabled) {
        await this.email.sendToUser(
          bb.userId,
          title,
          message,
          this.email.basicHtml(title, message),
        );
      }
    }

    this.logger.log(`Due reminders processed: soon=${dueSoon.length}, overdue=${overdue.length}`);
  }
}
