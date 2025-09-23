import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn, OneToOne } from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Book } from './book.entity';
import { AccessNumber } from './access-number.entity';

export enum BorrowedBookStatus {
  REQUESTED = 'requested',
  BORROWED = 'borrowed',
  RETURNED = 'returned',
  OVERDUE = 'overdue',
  REJECTED = 'rejected',
}

@Entity('borrowed_books')
export class BorrowedBook {
  @PrimaryGeneratedColumn('increment')
  id: number;

  @Column({ name: 'user_id' })
  userId: string;

  @ManyToOne(() => User, user => user.borrowedBooks)
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ name: 'book_id' })
  bookId: number;

  @ManyToOne(() => Book, book => book.borrowedBy)
  @JoinColumn({ name: 'book_id' })
  book: Book;

  @Column({ name: 'access_number_id', nullable: true })
  accessNumberId: number | null;

  @ManyToOne(() => AccessNumber, { nullable: true })
  @JoinColumn({ name: 'access_number_id' })
  accessNumber: AccessNumber;

  @Column({ name: 'borrowed_at', type: 'timestamp', nullable: true })
  borrowedAt: Date | null;

  @Column({ name: 'due_date', type: 'timestamp', nullable: true })
  dueDate: Date | null;

  @Column({ name: 'returned_at', type: 'timestamp', nullable: true })
  returnedAt: Date | null;

  @Column({ name: 'fine_amount', type: 'decimal', precision: 10, scale: 2, default: 0 })
  fineAmount: number;

  @Column({ default: false })
  isReturned: boolean;

  @Column({
    type: 'enum',
    enum: BorrowedBookStatus,
    default: BorrowedBookStatus.BORROWED
  })
  status: BorrowedBookStatus;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
