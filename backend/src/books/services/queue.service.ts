import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In, DataSource, EntityManager } from 'typeorm';
import { QueueEntry, QueueStatus } from '../entities/queue-entry.entity';
import { Book } from '../entities/book.entity';
import { BookCopy, BookCopyStatus } from '../entities/book-copy.entity';
import { LoanSettingsService } from 'src/sys-configs/loan-settings/loan-settings.service';
import { BookRequestStatus } from '../entities/book-request.entity';
import { Inject, forwardRef } from '@nestjs/common';
import { BookLoanService } from './book-loan.service';
import { EmailUtilsService } from '../../emails/email-utils.service';
import { BookRequest } from '../entities/book-request.entity';

@Injectable()
export class QueueService {
  constructor(
    @InjectRepository(QueueEntry)
    private readonly queueEntryRepository: Repository<QueueEntry>,
    @InjectRepository(Book)
    private readonly bookRepository: Repository<Book>,
    @InjectRepository(BookCopy)
    private readonly bookCopyRepository: Repository<BookCopy>,
    @Inject(forwardRef(() => BookLoanService))
    private readonly bookLoanService: BookLoanService,
    @Inject(forwardRef(() => LoanSettingsService))
    private readonly loanSettingsService: LoanSettingsService,
    @InjectRepository(BookRequest)
    private readonly bookRequestRepository: Repository<BookRequest>,
    private dataSource: DataSource,
    @Inject(forwardRef(() => EmailUtilsService))
    private readonly emailUtilsService: EmailUtilsService,
  ) {}

  async addToQueue(
    bookId: string,
    userId: string,
    manager?: EntityManager,
  ): Promise<QueueEntry> {
    // Use either the provided transaction manager or default repositories
    const bookRepo = manager
      ? manager.getRepository(Book)
      : this.bookRepository;
    const queueRepo = manager
      ? manager.getRepository(QueueEntry)
      : this.queueEntryRepository;

    // 1. Check if book exists
    const book = await bookRepo.findOne({ where: { id: parseInt(bookId) } });
    if (!book) {
      throw new NotFoundException('Book not found');
    }

    // 2. Check if user is already in queue for this book
    const existingEntry = await queueRepo.findOne({
      where: {
        book: { id: parseInt(bookId) },
        user: { id: userId },
        status: In([QueueStatus.WAITING, QueueStatus.FULFILLED]),
      },
    });

    if (existingEntry) {
      throw new ConflictException('You are already in the queue for this book');
    }

    // 3. Get queue position
    const queueCount = await queueRepo.count({
      where: { book: { id: parseInt(bookId) } },
    });

    // 4. Create queue entry
    const queueEntry = queueRepo.create({
      book: { id: parseInt(bookId) },
      user: { id: userId },
      status: QueueStatus.WAITING,
      position: queueCount + 1,
    });

    // 5. Increment book’s queue count
    await bookRepo.increment({ id: parseInt(bookId) }, 'queueCount', 1);

    // 6. Save entry
    return await queueRepo.save(queueEntry);
  }

  async getQueuePosition(
    entryId: string,
  ): Promise<{ position: number; total: number }> {
    const entry = await this.queueEntryRepository.findOne({
      where: { id: entryId },
      relations: ['book'],
    });

    if (!entry) {
      throw new NotFoundException('Queue entry not found');
    }

    const total = await this.queueEntryRepository.count({
      where: {
        book: { id: entry.book.id },
        status: QueueStatus.WAITING,
      },
    });

    return {
      position: entry.position,
      total,
    };
  }

  async getBookQueue(bookId: string): Promise<QueueEntry[]> {
    return this.queueEntryRepository.find({
      where: { book: { id: parseInt(bookId) } },
      relations: ['user', 'book'],
      order: { position: 'ASC' },
    });
  }

  async getUserQueues(userId: string): Promise<QueueEntry[]> {
    return this.queueEntryRepository.find({
      where: { user: { id: userId } },
      relations: ['book'],
      order: { position: 'ASC' },
    });
  }

  async processNextInQueue(bookId: string): Promise<void> {
    const settings = await this.loanSettingsService.getSettings();

    await this.dataSource.transaction(async (manager) => {
      // 1️⃣ Find all waiting users in queue, locked for update
      const entries = await manager.find(QueueEntry, {
        where: {
          book: { id: parseInt(bookId, 10) },
          status: QueueStatus.WAITING,
        },
        relations: ['user', 'book', 'bookRequest'],
        order: { position: 'ASC' },
        lock: { mode: 'pessimistic_write' },
      });

      if (entries.length === 0) {
        return; // No one in queue, we can exit safely
      }

      // 2️⃣ Find all available copies, locked for update
      const availableCopies = await manager.find(BookCopy, {
        where: {
          book: { id: parseInt(bookId, 10) },
          status: BookCopyStatus.AVAILABLE,
        },
        lock: { mode: 'pessimistic_write' },
      });

      if (availableCopies.length === 0) {
        return; // No copies available, exit safely
      }

      // 3️⃣ Match copies to users
      const matchCount = Math.min(entries.length, availableCopies.length);

      for (let i = 0; i < matchCount; i++) {
        const entry = entries[i];
        const copy = availableCopies[i];

        // Reserve the copy
        copy.status = BookCopyStatus.RESERVED;
        await manager.save(BookCopy, copy);

        // Update queue entry
        entry.status = QueueStatus.READY;
        entry.readyAt = new Date();
        entry.expiresAt = new Date(
          Date.now() + settings.queueHoldDurationHours * 60 * 60 * 1000,
        );
        await manager.save(QueueEntry, entry);

        // ALWAYS create/update the pending BookRequest so the user sees it in their portal to "accept"/pick up
        const requestId = await this.createPendingApprovalWithManager(
          manager,
          entry,
          false,
          copy,
        );

        // If the library was built to strictly auto-create a loan (bypassing pickup phase)...
        if (settings.autoApproveQueueLoans) {
          try {
            await this.bookLoanService.createLoan(manager, {
              preferredCopyId: copy.id.toString(),
              bookId: bookId.toString(),
              userId: entry.user.id,
              requestId: requestId,
            });

            // Mark queue entry fulfilled
            entry.status = QueueStatus.FULFILLED;
            entry.fulfilledAt = new Date();
            await manager.save(QueueEntry, entry);

            // Notify user
            this.emailUtilsService
              .sendLoanConfirmationEmail(
                entry.user,
                entry.book,
                entry.expiresAt,
                entry.readyAt,
                entry.id,
              )
              .catch((e) => console.error(e));
          } catch (error) {
            console.error(
              `Auto-loan failed for user ${entry.user.id}: ${error.message}`,
            );
          }
        }
      }
    });
  }

  // Helper method that uses the provided entity manager to respect the transaction
  private async createPendingApprovalWithManager(
    manager: EntityManager,
    entry: QueueEntry,
    autoGenerated: boolean,
    copy: BookCopy,
  ): Promise<string> {
    let request = entry.bookRequest;

    if (request && request.status === BookRequestStatus.QUEUED) {
      request.status = BookRequestStatus.PENDING;
      request.autoGenerated = autoGenerated;
      request.createdAt = new Date();
      await manager.save(BookRequest, request);
    } else {
      request = manager.create(BookRequest, {
        user: { id: entry.user.id },
        book: { id: entry.book.id },
        status: BookRequestStatus.PENDING,
        createdAt: new Date(),
        autoGenerated: autoGenerated,
        queueEntryId: entry.id,
      });
      await manager.save(BookRequest, request);
    }

    entry.status = QueueStatus.PENDING_APPROVAL;
    entry.bookRequestId = request.id;
    await manager.save(QueueEntry, entry);

    return request.id;
  }

  private async createPendingApproval(
    entry: QueueEntry,
    autoGenerated: boolean,
    copy: BookCopy,
  ) {
    let request = entry.bookRequest;

    if (request && request.status === BookRequestStatus.QUEUED) {
      // Reuse existing request
      request.status = BookRequestStatus.PENDING;
      request.autoGenerated = autoGenerated;
      request.createdAt = new Date(); // Update timestamp to now
      await this.bookRequestRepository.save(request);
      console.log(
        `Reused existing QUEUED request ${request.id} and set to PENDING`,
      );
    } else {
      // Create new request since no suitable existing one was found
      request = this.bookRequestRepository.create({
        user: { id: entry.user.id },
        book: { id: entry.book.id },
        status: BookRequestStatus.PENDING,
        createdAt: new Date(),
        autoGenerated: autoGenerated,
        queueEntryId: entry.id,
      });
      await this.bookRequestRepository.save(request);
      console.log(`Created new BookRequest for queue entry ${entry.id}`);
    }

    // Update queue entry to "waiting for librarian"
    entry.status = QueueStatus.PENDING_APPROVAL;
    entry.bookRequestId = request.id;
    await this.queueEntryRepository.save(entry);

    // Notify librarian
    // await this.notificationService.notifyLibrarians({
    //   type: 'QUEUE_APPROVAL_REQUIRED',
    //   message: `Book "${entry.book.title}" is ready for ${entry.user.name}. Approval needed.`,
    //   link: `/admin/requests/${request.id}`,
    // });

    console.log(
      `Created pending approval for user ${entry.user.id} for book ${entry.book.title}`,
    );
    return request.id;
  }

  async cancelQueueEntry(entryId: string, userId: string): Promise<void> {
    const entry = await this.queueEntryRepository.findOne({
      where: { id: entryId, user: { id: userId } },
    });

    if (!entry) {
      throw new NotFoundException('Queue entry not found');
    }

    if (entry.status !== QueueStatus.WAITING) {
      throw new ConflictException(
        'Only waiting queue entries can be cancelled',
      );
    }

    // Update book's queue count
    await this.bookRepository.decrement({ id: entry.book.id }, 'queueCount', 1);

    // Remove the entry
    await this.queueEntryRepository.remove(entry);

    // Update positions of remaining entries
    await this.queueEntryRepository
      .createQueryBuilder()
      .update(QueueEntry)
      .set({ position: () => 'position - 1' })
      .where('bookId = :bookId AND position > :position', {
        bookId: entry.book.id,
        position: entry.position,
      })
      .execute();
  }

  async markAsPicked(entryId: string): Promise<void> {
    const entry = await this.queueEntryRepository.findOne({
      where: { id: entryId },
      relations: ['book'],
    });

    if (!entry) {
      throw new NotFoundException('Queue entry not found');
    }

    if (entry.status !== QueueStatus.FULFILLED) {
      throw new ConflictException('This entry is not ready for pickup');
    }

    // Mark as fulfilled
    entry.status = QueueStatus.FULFILLED;
    await this.queueEntryRepository.save(entry);

    // Update book's queue count
    await this.bookRepository.decrement({ id: entry.book.id }, 'queueCount', 1);
  }
}
