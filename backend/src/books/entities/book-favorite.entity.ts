import { Entity, PrimaryGeneratedColumn, CreateDateColumn, ManyToOne, JoinColumn, DeleteDateColumn, Unique, Column } from 'typeorm';
import { User } from 'src/users/entities/user.entity';
import { Book } from './book.entity';

@Entity('book_favorites')
@Unique(['userId', 'bookId']) // Ensure a user can only favorite a book once
export class BookFavorite {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @DeleteDateColumn({ name: 'deleted_at', nullable: true })
  deletedAt?: Date;

  @ManyToOne(() => User, user => user.bookFavorites, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column({ name: 'userId' })
  userId: string;

  @ManyToOne(() => Book, book => book.favorites, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'bookId' })
  book: Book;

  @Column({ name: 'bookId' })
  bookId: number;
}
