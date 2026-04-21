import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan, In } from 'typeorm';
import { QueueEntry, QueueStatus } from '../entities/queue-entry.entity';
import { BookCopy, BookCopyStatus } from '../entities/book-copy.entity';
import { BookRequest, BookRequestStatus } from '../entities/book-request.entity';
import { QueueService } from './queue.service';

@Injectable()
export class QueueCleanupService {
  private readonly logger = new Logger(QueueCleanupService.name);

  constructor(
    @InjectRepository(QueueEntry)
    private readonly queueEntryRepository: Repository<QueueEntry>,
    @InjectRepository(BookCopy)
    private readonly bookCopyRepository: Repository<BookCopy>,
    @InjectRepository(BookRequest)
    private readonly bookRequestRepository: Repository<BookRequest>,
    private readonly queueService: QueueService,
  ) {}

  @Cron(CronExpression.EVERY_30_MINUTES)
  async handleExpiredQueueEntries() {
    this.logger.log('Starting cleanup of expired queue entries');

    try {
      // Find entries that are READY or PENDING_APPROVAL but have passed their expiry time
      const expiredEntries = await this.queueEntryRepository.find({
        where: {
          status: In([QueueStatus.READY, QueueStatus.PENDING_APPROVAL]),
          expiresAt: LessThan(new Date()),
        },
        relations: ['book', 'bookRequest'],
      });

      if (expiredEntries.length === 0) {
        this.logger.log('No expired queue entries found');
        return;
      }

      this.logger.log(`Found ${expiredEntries.length} expired queue entries. Processing decay...`);

      for (const entry of expiredEntries) {
        await this.processExpiredEntry(entry);
      }
      
      this.logger.log('Completed cleanup of expired queue entries');
    } catch (error) {
      this.logger.error('Failed to process expired queue entries', error.stack);
    }
  }

  private async processExpiredEntry(entry: QueueEntry) {
    try {
      // 1. Mark entry as EXPIRED
      entry.status = QueueStatus.EXPIRED;
      await this.queueEntryRepository.save(entry);

      // 2. If there was an associated request, mark it as CANCELLED or appropriate status
      if (entry.bookRequest) {
         if (entry.bookRequest.status !== BookRequestStatus.FULFILLED && entry.bookRequest.status !== BookRequestStatus.REJECTED) {
             entry.bookRequest.status = BookRequestStatus.CANCELLED;
             entry.bookRequest.rejectionReason = 'Automated cancellation due to queue reservation expiry';
             await this.bookRequestRepository.save(entry.bookRequest);
         }
      }

      // 3. Find any RESERVED copies for this book and release ONE of them
      // In a strict mapping, we'd know which copy was reserved for which entry.
      // Since we don't map Copy <-> QueueEntry directly, we release one reserved copy for this book.
      const reservedCopy = await this.bookCopyRepository.findOne({
        where: {
          book: { id: entry.book.id },
          status: BookCopyStatus.RESERVED,
        },
      });

      if (reservedCopy) {
        reservedCopy.status = BookCopyStatus.AVAILABLE;
        await this.bookCopyRepository.save(reservedCopy);
        this.logger.log(`Released reserved copy ${reservedCopy.id} for book ${entry.book.id} back to AVAILABLE`);
      }

      // 4. Update the queue count for the book (since someone dropped out)
      // Note: This relies on the core book repository. We can just process next.
      
      // 5. Trigger the queue again! Now that a copy is back to AVAILABLE (or we just removed a blocker),
      // the next person in line should get it.
      await this.queueService.processNextInQueue(entry.book.id.toString());
      
      this.logger.log(`Successfully expired entry ${entry.id} for user ${entry.user?.id || 'unknown'} and triggered next in queue.`);

    } catch (error) {
       this.logger.error(`Failed to process expired entry ${entry.id}`, error.stack);
    }
  }
}
