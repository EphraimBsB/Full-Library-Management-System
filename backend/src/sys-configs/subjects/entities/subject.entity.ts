import { Entity, PrimaryGeneratedColumn, Column, ManyToMany, JoinTable, DeleteDateColumn } from 'typeorm';
import { Book } from '../../../books/entities/book.entity';

@Entity('subjects')
export class Subject {
  @PrimaryGeneratedColumn('increment')
  id: number;

  @Column({ unique: true })
  name: string;

  @Column({ nullable: true })
  description: string;

  @Column({ type: 'boolean', default: true })
  isActive: boolean;

  @ManyToMany(() => Book, book => book.subjects)
  books: Book[];
}
