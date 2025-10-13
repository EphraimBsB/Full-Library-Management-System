import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn, UpdateDateColumn, OneToOne } from 'typeorm';
import { BookCopy } from './book-copy.entity';
import { User } from 'src/users/entities/user.entity';
import { Membership } from 'src/membership/entities/membership.entity';
import { QueueEntry } from './queue-entry.entity';
import { BookRequest } from './book-request.entity';

export enum LoanStatus {
  ACTIVE = 'ACTIVE',
  RETURNED = 'RETURNED',
  OVERDUE = 'OVERDUE',
  LOST = 'LOST',
}

@Entity('book_loans')
export class BookLoan {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'int' })
  bookCopyId: number;

  @Column({ type: 'uuid' })
  userId: string;

  @Column({ type: 'uuid', nullable: true })
  queueEntryId: string | null;

  @Column({ type: 'timestamp' })
  borrowedAt: Date;

  @Column({ type: 'timestamp' })
  dueDate: Date;

  @Column({ type: 'timestamp', nullable: true })
  lastRenewedAt: Date | null;

  @Column({ type: 'timestamp', nullable: true })
  returnedAt: Date | null;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  fineAmount: number;

  @Column({ type: 'int', default: 0 })
  renewalCount: number;

  @Column({
    type: 'enum',
    enum: LoanStatus,
    default: LoanStatus.ACTIVE,
  })
  status: LoanStatus;

  @Column({ type: 'text', nullable: true })
  notes: string | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @ManyToOne(() => BookCopy, bookCopy => bookCopy.loans)
  @JoinColumn({ name: 'bookCopyId' })
  bookCopy: BookCopy;

  @ManyToOne(() => User, user => user.bookLoans, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User;

  @ManyToOne(() => Membership, membership => membership.loans, { onDelete: 'RESTRICT', nullable: true })
  @JoinColumn({ name: 'membershipId' })
  membership: Membership | null;

  @OneToOne(() => QueueEntry, queueEntry => queueEntry.loan, { nullable: true })
  @JoinColumn({ name: 'queueEntryId' })
  queueEntry: QueueEntry | null;

  @Column({ type: 'uuid', nullable: true })
  returnedBy: string | null;

  @OneToOne(() => BookRequest, request => request.loan, {
    onDelete: 'SET NULL',
    nullable: true
  })
  @JoinColumn({ name: 'requestId' })
  request: BookRequest | null;

  @Column({ type: 'uuid', nullable: true })
  requestId: string | null;
}
