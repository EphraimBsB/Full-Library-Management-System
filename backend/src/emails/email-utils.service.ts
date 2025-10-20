import { Injectable, Logger } from '@nestjs/common';
import { EmailService } from './email.service';
import { User } from '../users/entities/user.entity';
import { Book } from '../books/entities/book.entity';
import { LoanStatus } from '../books/entities/book-loan.entity';
import { BookLoan } from '../books/entities/book-loan.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

@Injectable()
export class EmailUtilsService {
  private readonly logger = new Logger(EmailUtilsService.name);
  private readonly loanReminderDays = 1; // How many days before due date to send reminder

  constructor(
    private readonly emailService: EmailService,
    @InjectRepository(BookLoan)
    private readonly bookLoanRepository: Repository<BookLoan>,
  ) {}

  /**
   * Generic email sending method that can be used for any email template
   */
  async sendEmail(
    to: string,
    subject: string,
    template: string,
    context: Record<string, any>
  ): Promise<void> {
    try {
      await this.emailService.sendEmail(to, subject, template, context);
    } catch (error) {
      this.logger.error(
        `Failed to send ${template} email to ${to}: ${error.message}`,
        error.stack
      );
      throw error; // Re-throw to allow caller to handle the error
    }
  }

  /**
   * Sends a loan confirmation email
   */
  async sendLoanConfirmationEmail(
    user: User,
    book: Book,
    dueDate: Date,
    issueDate: Date,
    loanId: string
  ): Promise<void> {
    try {
      await this.emailService.sendEmail(
        user.email,
        `Book Loan Confirmation: ${book.title}`,
        'book-issued',
        {
          userName: `${user.firstName} ${user.lastName}`,
          bookTitle: book.title,
          bookAuthor: book.author,
          issueDate: issueDate.toLocaleDateString(),
          dueDate: dueDate.toLocaleDateString(),
          loanId,
          supportEmail: 'library@example.com',
        }
      );
    } catch (error) {
      this.logger.error(`Failed to send loan confirmation email: ${error.message}`, error.stack);
      throw error; // Re-throw to allow caller to handle the error
    }
  }

  /**
   * Sends a return reminder email
   */
  async sendReturnReminderEmail(
    user: User,
    book: Book,
    dueDate: Date,
    issueDate: Date,
    loanId: string
  ): Promise<void> {
    try {
      await this.emailService.sendEmail(
        user.email,
        `Reminder: Return ${book.title} by ${dueDate.toLocaleDateString()}`,
        'due-reminder',
        {
          userName: `${user.firstName} ${user.lastName}`,
          bookTitle: book.title,
          bookAuthor: book.author,
          issueDate: issueDate.toLocaleDateString(),
          dueDate: dueDate.toLocaleDateString(),
          loanId,
          supportEmail: 'library@example.com',
        }
      );
    } catch (error) {
      this.logger.error(`Failed to send return reminder email: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Sends a loan overdue email
   */
  async sendOverdueNoticeEmail(
    user: User,
    book: Book,
    dueDate: Date,
    issueDate: Date,
    loanId: string,
    fineAmount: number
  ): Promise<void> {
    try {
      await this.emailService.sendEmail(
        user.email,
        `Overdue Notice: Please Return ${book.title}`,
        'overdue-notice',
        {
          userName: `${user.firstName} ${user.lastName}`,
          bookTitle: book.title,
          bookAuthor: book.author,
          issueDate: issueDate.toLocaleDateString(),
          dueDate: dueDate.toLocaleDateString(),
          fineAmount: fineAmount.toFixed(2),
          loanId,
          supportEmail: 'library@example.com',
        }
      );
    } catch (error) {
      this.logger.error(`Failed to send overdue notice email: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Schedules a return reminder email to be sent one day before the due date
   */
  scheduleReturnReminder(
    loanId: string,
    user: User,
    book: Book,
    dueDate: Date,
    issueDate: Date
  ): void {
    try {
      // Calculate when to send the reminder (1 day before due date)
      const reminderDate = new Date(dueDate);
      reminderDate.setDate(reminderDate.getDate() - this.loanReminderDays);
      
      // If the due date is less than the reminder period from now, don't schedule a reminder
      if (reminderDate <= new Date()) {
        this.logger.log(`Not scheduling reminder for loan ${loanId} as due date is within ${this.loanReminderDays} day(s)`);
        return;
      }

      const timeout = reminderDate.getTime() - Date.now();
      
      setTimeout(async () => {
        try {
          // Verify the loan is still active before sending reminder
          const loan = await this.bookLoanRepository.findOne({
            where: { id: loanId, status: LoanStatus.ACTIVE },
            relations: ['bookCopy', 'user']
          });

          if (loan) {
            await this.sendReturnReminderEmail(user, book, dueDate, issueDate, loanId);
            this.logger.log(`Sent return reminder for loan ${loanId}`);
          } else {
            this.logger.log(`Loan ${loanId} is no longer active, skipping reminder`);
          }
        } catch (error) {
          this.logger.error(
            `Error sending return reminder for loan ${loanId}: ${error.message}`,
            error.stack
          );
        }
      }, timeout);

      this.logger.log(`Scheduled return reminder for loan ${loanId} at ${reminderDate}`);
    } catch (error) {
      this.logger.error(
        `Error scheduling return reminder for loan ${loanId}: ${error.message}`,
        error.stack
      );
    }
  }

  async sendReturnConfirmationEmail(
    user: User,
    book: Book,
    dueDate: Date,
    issueDate: Date,
    loanId: string
  ): Promise<void> {
    try {
      await this.emailService.sendEmail(
        user.email,
        `Return Confirmation: ${book.title}`,
        'return-confirmation',
        {
          userName: `${user.firstName} ${user.lastName}`,
          bookTitle: book.title,
          bookAuthor: book.author,
          issueDate: issueDate.toLocaleDateString(),
          dueDate: dueDate.toLocaleDateString(),
          loanId,
          supportEmail: 'library@example.com',
        }
      );
    } catch (error) {
      this.logger.error(`Failed to send return confirmation email: ${error.message}`, error.stack);
      throw error;
    }
  }

  async sendRequestRejectedEmail(
    user: User,
    book: Book,
    reason: string,
    rejectedById: string
  ): Promise<void> {
    try {
      await this.emailService.sendEmail(
        user.email,
        `Request Rejected: ${book.title}`,
        'rejected',
        {
          userName: `${user.firstName} ${user.lastName}`,
          bookTitle: book.title,
          bookAuthor: book.author,
          reason,
          rejectedById,
          supportEmail: 'library@example.com',
        }
      );
    } catch (error) {
      this.logger.error(`Failed to send request rejected email: ${error.message}`, error.stack);
      throw error;
    }
  }
}
