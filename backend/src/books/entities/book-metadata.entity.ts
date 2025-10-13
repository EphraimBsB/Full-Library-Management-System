import { Entity, PrimaryGeneratedColumn, Column, OneToOne, JoinColumn } from 'typeorm';
import { Book } from './book.entity';

@Entity('book_metadata')
export class BookMetadata {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'int', default: 0 })
  views: number;

  @Column({ type: 'float', default: 0 })
  averageRating: number;

  @Column({ type: 'int', default: 0 })
  ratingCount: number;

  @Column({ type: 'int', default: 0 })
  downloadCount: number;

  @Column({ type: 'int', default: 0 })
  favoriteCount: number;

  @Column({ type: 'timestamp', nullable: true })
  lastAccessedAt: Date;

  @OneToOne(() => Book, book => book.metadata, { onDelete: 'CASCADE' })
  @JoinColumn()
  book: Book;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  createdAt: Date;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP', onUpdate: 'CURRENT_TIMESTAMP' })
  updatedAt: Date;
}
