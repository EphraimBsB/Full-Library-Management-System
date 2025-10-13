import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThanOrEqual, MoreThanOrEqual, Between } from 'typeorm';
import { BookLoan, LoanStatus } from 'src/books/entities/book-loan.entity';
import { NotificationsService } from './notifications.service';
import { NotificationType } from './entities/notification.entity';
import { EmailService } from 'src/emails/email.service';

@Injectable()
export class NotificationsScheduler {
  private readonly logger = new Logger(NotificationsScheduler.name);

  constructor(
    @InjectRepository(BookLoan)
    private readonly bookLoanRepo: Repository<BookLoan>,
    private readonly notifications: NotificationsService,
    private readonly email: EmailService,
  ) {}

  // Runs every day at 08:00 server time
  @Cron(CronExpression.EVERY_DAY_AT_8AM)
  async sendDueReminders() {
    try {
      const now = new Date();
      const in24h = new Date(now.getTime() + 24 * 60 * 60 * 1000);
      const frontendUrl = process.env.FRONTEND_URL || 'https://yourlibrary.com';

      // 1. Process due soon notifications (due in next 24 hours)
      const dueSoon = await this.bookLoanRepo.find({
        where: {
          status: LoanStatus.ACTIVE as any,
          dueDate: Between(now, in24h),
        },
        relations: ['bookCopy', 'bookCopy.book', 'user'],
      });

      // Process due soon notifications
      for (const loan of dueSoon) {
        if (!loan.user?.email) continue;

        const bookTitle = loan.bookCopy?.book?.title ?? 'a book';
        const dueDate = loan.dueDate?.toLocaleDateString() ?? 'soon';
        const title = 'Book Due Soon';
        const message = `The book "${bookTitle}" is due by ${dueDate}. Please return it on time to avoid late fees.`;

        // Create in-app notification
        await this.notifications.create({
          userId: loan.userId,
          type: NotificationType.DUE_SOON,
          title,
          message,
          data: {
            loanId: loan.id,
            bookId: loan.bookCopy?.book?.id,
            dueDate: loan.dueDate?.toISOString(),
          },
        });

        // Send email notification
        try {
          await this.email.sendEmail(
            loan.user.email,
            `${title}: ${bookTitle}`,
            'due-reminder',
            {
              userName: loan.user.firstName || 'there',
              bookTitle,
              dueDate,
              returnLink: `${frontendUrl}/my-loans`,
            }
          );
          this.logger.log(`Due reminder email sent for loan ${loan.id}`);
        } catch (error) {
          this.logger.error(`Failed to send due reminder email for loan ${loan.id}:`, error.message);
        }
      }

      // 2. Process overdue notifications (past due date)
      const overdue = await this.bookLoanRepo.find({
        where: {
          status: LoanStatus.ACTIVE as any,
          dueDate: LessThanOrEqual(now),
        },
        relations: ['bookCopy', 'bookCopy.book', 'user'],
      });

      // Process overdue notifications
      for (const loan of overdue) {
        if (!loan.user?.email) continue;

        const bookTitle = loan.bookCopy?.book?.title ?? 'a book';
        const dueDate = loan.dueDate?.toLocaleDateString() ?? '';
        const title = 'Book Overdue';
        const message = `The book "${bookTitle}" is overdue. Please return it as soon as possible to avoid additional fees.`;

        // Create in-app notification
        await this.notifications.create({
          userId: loan.userId,
          type: NotificationType.OVERDUE,
          title,
          message,
          data: { 
            loanId: loan.id,
            bookId: loan.bookCopy?.book?.id,
            dueDate: loan.dueDate?.toISOString() 
          },
        });

        // Send email notification for overdue
        try {
          await this.email.sendEmail(
            loan.user.email,
            `${title}: ${bookTitle}`,
            'overdue-notice',
            {
              userName: loan.user.firstName || 'there',
              bookTitle,
              dueDate,
              daysOverdue: Math.ceil((now.getTime() - (loan.dueDate?.getTime() || now.getTime())) / (1000 * 60 * 60 * 24)),
              returnLink: `${frontendUrl}/my-loans`,
              contactEmail: process.env.SUPPORT_EMAIL || 'support@yourlibrary.com',
            }
          );
          this.logger.log(`Overdue notice sent for loan ${loan.id}`);
        } catch (error) {
          this.logger.error(`Failed to send overdue notice for loan ${loan.id}:`, error.message);
        }
      }

      // Log completion with counts
      this.logger.log(`Scheduled notifications completed: ${dueSoon.length} due soon, ${overdue.length} overdue`);
    } catch (error) {
      this.logger.error('Error in scheduled notifications:', error);
      throw error; // Re-throw to mark the job as failed in the scheduler
    }
  }
}
