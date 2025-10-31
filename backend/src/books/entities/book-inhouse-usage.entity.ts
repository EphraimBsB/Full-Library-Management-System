import { Book } from './book.entity';
import { BookCopy } from './book-copy.entity';
import { User } from '../../users/entities/user.entity';
import { 
  Entity, 
  PrimaryGeneratedColumn, 
  Column, 
  ManyToOne, 
  JoinColumn, 
  CreateDateColumn,
  Index,
  UpdateDateColumn
} from 'typeorm';

export enum InhouseUsageStatus {
  ACTIVE = 'active',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
  FORCE_ENDED = 'force_ended'
}

@Entity('book_inhouse_usage')
export class BookInhouseUsage {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Book, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'book_id' })
  book: Book;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @ManyToOne(() => BookCopy, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'copy_id' })
  copy: BookCopy | null;

  @Column({ type: 'timestamp', name: 'started_at' })
  startedAt: Date;

  @Column({ type: 'timestamp', name: 'ended_at', nullable: true })
  endedAt: Date | null;

  @Column({ type: 'int', name: 'duration_minutes', nullable: true })
  durationMinutes: number | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @Column({
    type: 'enum',
    enum: InhouseUsageStatus,
    default: InhouseUsageStatus.ACTIVE
  })
  status: InhouseUsageStatus;

  // Update duration when endedAt is set
  updateDuration(): void {
    if (this.endedAt && this.startedAt) {
      const diffMs = this.endedAt.getTime() - this.startedAt.getTime();
      this.durationMinutes = Math.floor(diffMs / (1000 * 60));
    }
  }
}
