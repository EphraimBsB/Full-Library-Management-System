import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn, UpdateDateColumn, Index } from 'typeorm';
import { User } from '../../users/entities/user.entity';

export enum NotificationType {
  BOOK_REQUEST_STATUS = 'BOOK_REQUEST_STATUS',
  BORROWED_BOOK_DUE = 'BORROWED_BOOK_DUE',
  DUE_SOON = 'DUE_SOON',
  OVERDUE = 'OVERDUE',
  GENERAL = 'GENERAL',
}

@Entity('notifications')
export class Notification {
  @PrimaryGeneratedColumn('increment')
  id: number;

  @ManyToOne(() => User, (user) => user.id, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User;

  @Index()
  @Column()
  userId: string;

  @Column({ type: 'enum', enum: NotificationType, default: NotificationType.GENERAL })
  type: NotificationType;

  @Column({ length: 200 })
  title: string;

  @Column('text')
  message: string;

  @Column({ type: 'json', nullable: true })
  data?: Record<string, any> | null;

  @Index()
  @Column({ type: 'timestamp', nullable: true })
  readAt: Date | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
