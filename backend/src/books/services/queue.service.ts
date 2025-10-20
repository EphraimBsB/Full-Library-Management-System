import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
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
  ) { }

  async addToQueue(
  bookId: string,
  userId: string,
  manager?: EntityManager
): Promise<QueueEntry> {
  // Use either the provided transaction manager or default repositories
  const bookRepo = manager ? manager.getRepository(Book) : this.bookRepository;
  const queueRepo = manager ? manager.getRepository(QueueEntry) : this.queueEntryRepository;

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


  async getQueuePosition(entryId: string): Promise<{ position: number; total: number }> {
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
    const settings = await this.loanSettingsService.getSettings(); // e.g. from a single row in DB

    // 1️⃣ Find the next waiting user in queue
    const entry = await this.queueEntryRepository.findOne({
      where: {
        book: { id: parseInt(bookId, 10) },
        status: QueueStatus.WAITING,
      },
      relations: ['user', 'book'],
      order: { position: 'ASC' },
    });

    if (!entry) {
      throw new NotFoundException(`No users in queue for this book`);
    }

    // 2️⃣ Find available copy
    const availableCopy = await this.bookCopyRepository.findOne({
      where: {
        book: { id: parseInt(bookId, 10) },
        status: BookCopyStatus.AVAILABLE,
      },
    });

    if (!availableCopy) {
      throw new NotFoundException(`No available copies for this book`);
    }

    // 3️⃣ Update queue entry to READY (book is available for them)
    entry.status = QueueStatus.READY;
    entry.readyAt = new Date();
    entry.expiresAt = new Date(Date.now() + settings.queueHoldDurationHours * 60 * 60 * 1000); // e.g., 24 hours
    await this.queueEntryRepository.save(entry);

    // 4️⃣ Handle depending on library setting
    if (settings.autoApproveQueueLoans) {
      // ✅ Auto-approve: directly create a loan
      try {
        const requestId = await this.createPendingApproval(entry, true, availableCopy);
        await this.bookLoanService.createLoan(this.dataSource.manager, {
          preferredCopyId: availableCopy.id.toString(),
          bookId: bookId.toString(),
          userId: entry.user.id,
          requestId: requestId,
        });

        // Mark queue entry fulfilled
        entry.status = QueueStatus.FULFILLED;
        entry.fulfilledAt = new Date();
        await this.queueEntryRepository.save(entry);

        // Notify user via email
        await this.emailUtilsService.sendLoanConfirmationEmail(entry.user, entry.book, entry.expiresAt, entry.readyAt, entry.id);

      } catch (error) {
        console.error(`Auto-loan failed for user ${entry.user.id}: ${error.message}`);
        // Optionally fallback to pending approval
        await this.createPendingApproval(entry, false, availableCopy);
      }
    } else {
      // 🧾 Manual approval mode — create a pending BookRequest
      await this.createPendingApproval(entry, false, availableCopy);
    }
  }

  private async createPendingApproval(entry: QueueEntry, autoGenerated: boolean, copy: BookCopy) {
    const request = this.bookRequestRepository.create({
      user: { id: entry.user.id },
      book: { id: entry.book.id },
      status: BookRequestStatus.PENDING,
      createdAt: new Date(),
      autoGenerated: autoGenerated,
    });

    await this.bookRequestRepository.save(request);

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

    console.log(`Created pending approval for user ${entry.user.id} for book ${entry.book.title}`);
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
      throw new ConflictException('Only waiting queue entries can be cancelled');
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
