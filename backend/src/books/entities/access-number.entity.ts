import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, Unique, OneToMany } from 'typeorm';
import { Book } from './book.entity';
import { BorrowedBook } from './borrowed-book.entity';

@Entity('access_numbers')
export class AccessNumber {
  @PrimaryGeneratedColumn('increment')
  id: number;

  @Column()
  number: string;

  @Column({ name: 'book_id', type: 'int' })
  bookId: number;

  @ManyToOne(() => Book, book => book.accessNumbers, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'book_id' })
  book: Book;

  @OneToMany(() => BorrowedBook, borrowedBook => borrowedBook.accessNumber, { cascade: true })
  borrowedBooks: BorrowedBook[];

  // Create a composite unique constraint on number and book_id
  @Unique('UQ_access_number_book', ['number', 'bookId'])

  @Column({ 
    type: 'timestamp', 
    precision: 3,
    default: () => 'CURRENT_TIMESTAMP(3)' 
  })
  createdAt: Date;

  @Column({ 
    type: 'timestamp', 
    precision: 3,
    default: () => 'CURRENT_TIMESTAMP(3)', 
    onUpdate: 'CURRENT_TIMESTAMP(3)' 
  })
  updatedAt: Date;
}
