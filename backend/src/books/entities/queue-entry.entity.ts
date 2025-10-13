import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn, UpdateDateColumn, OneToOne, Index } from 'typeorm';
import { Book } from './book.entity';
import { User } from '../../users/entities/user.entity';
import { BookRequest } from './book-request.entity';
import { BookLoan } from './book-loan.entity';

export enum QueueStatus {
  WAITING = 'WAITING',
  READY = 'READY',
  PENDING_APPROVAL = 'PENDING_APPROVAL',
  FULFILLED = 'FULFILLED',
  CANCELLED = 'CANCELLED',
  EXPIRED = 'EXPIRED',
}

@Entity('queue_entries')
@Index(['bookId', 'status', 'position']) // For finding next in queue
@Index(['userId', 'status']) // For user's queue positions
export class QueueEntry {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  bookId: string;

  @Column({ type: 'uuid' })
  userId: string;

  @Column({ type: 'uuid', nullable: true })
  bookRequestId: string | null;

  @Column({
    type: 'enum',
    enum: QueueStatus,
    default: QueueStatus.WAITING,
  })
  status: QueueStatus;

  @Column({ type: 'int' })
  position: number;

  @Column({ type: 'timestamp', nullable: true })
  readyAt: Date | null;

  @Column({ type: 'timestamp', nullable: true })
  expiresAt: Date | null;

  @Column({ type: 'timestamp', nullable: true })
  fulfilledAt: Date | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @ManyToOne(() => Book, book => book.queueEntries)
  @JoinColumn({ name: 'bookId' })
  book: Book;

  @ManyToOne(() => User, user => user.queueEntries)
  @JoinColumn({ name: 'userId' })
  user: User;

  @OneToOne(() => BookRequest, request => request.queueEntry, { nullable: true })
  @JoinColumn({ name: 'bookRequestId' })
  bookRequest: BookRequest | null;

  @OneToOne(() => BookLoan, loan => loan.queueEntry, { nullable: true })
  loan: BookLoan | null;
}
