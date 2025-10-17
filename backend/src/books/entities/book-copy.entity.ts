import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, OneToMany, CreateDateColumn, UpdateDateColumn, DeleteDateColumn } from 'typeorm';
import { Book } from './book.entity';
import { BookLoan } from './book-loan.entity';

export enum BookCopyStatus {
  AVAILABLE = 'AVAILABLE',
  BORROWED = 'BORROWED',
  LOST = 'LOST',
  DAMAGED = 'DAMAGED',
  IN_REPAIR = 'IN_REPAIR',
  WITHDRAWN = 'WITHDRAWN',
}

@Entity('book_copies')
export class BookCopy {
  @PrimaryGeneratedColumn('increment')
  id: number;

  @Column({ type: 'uuid' })
  bookId: string;

  @Column({ type: 'varchar', length: 50, unique: false })
  accessNumber: string;

  @Column({
    type: 'enum',
    enum: BookCopyStatus,
    default: BookCopyStatus.AVAILABLE,
  })
  status: BookCopyStatus;

  @Column({ type: 'text', nullable: true })
  notes: string | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @DeleteDateColumn({ name: 'deleted_at', nullable: true })
  deletedAt: Date | null;

  @ManyToOne(() => Book, book => book.copies)
  @JoinColumn({ name: 'bookId' })
  book: Book;

  @OneToMany(() => BookLoan, loan => loan.bookCopy)
  loans: BookLoan[];

  @Column({ type: 'boolean', default: true })
  isActive: boolean;
}
