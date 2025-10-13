import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, OneToMany, CreateDateColumn, UpdateDateColumn, Index, DeleteDateColumn, BeforeInsert, BeforeUpdate, JoinTable, ManyToMany, OneToOne } from 'typeorm';
import { IsString, IsUUID, IsOptional, IsUrl, IsNumber, Min, Max, IsEnum, IsDateString, IsBoolean, ValidateNested, ArrayMinSize, IsInt, IsISBN } from 'class-validator';
import { Type } from 'class-transformer';
import { Type as TypeEntity } from '../../sys-configs/types/entities/type.entity';
import { Subject } from '../../sys-configs/subjects/entities/subject.entity';
import { BookCopy } from './book-copy.entity';
import { BookRequest } from './book-request.entity';
import { BookLoan } from './book-loan.entity';
import { QueueEntry } from './queue-entry.entity';
import { Category } from 'src/sys-configs/categories/entities/category.entity';
import { Source } from 'src/sys-configs/sources/entities/source.entity';
import { BookMetadata } from './book-metadata.entity';

@Entity('books')
@Index(['title', 'author'])
@Index(['publicationYear'])
@Index(['type'])
export class Book {
  @PrimaryGeneratedColumn('increment')
  id: number;

  @Column({ nullable: false })
  @IsString()
  title: string;

  @Column({ nullable: false })
  @IsString()
  author: string;

  @Column({ nullable: true, unique: true })
  @IsOptional()
  @IsString()
  @IsISBN()
  isbn?: string;

  @Column({ nullable: true })
  @IsOptional()
  @IsString()
  publisher?: string;

  @Column('int', { nullable: true })
  @IsOptional()
  @IsInt()
  @Min(0)
  publicationYear?: number;

  @Column({ nullable: true })
  @IsOptional()
  @IsString()
  edition?: string;

  @OneToMany(() => BookCopy, (copy) => copy.book)
  @ValidateNested({ each: true })
  @Type(() => BookCopy)
  copies: BookCopy[];

  @Column('int', { default: 1 })
  @IsInt()
  @Min(0)
  totalCopies: number = 1;

  @Column('int', { default: 1 })
  @IsInt()
  @Min(0)
  availableCopies: number = 1;

  @Column('text', { nullable: true })
  @IsOptional()
  @IsString()
  description?: string;

  @Column({ nullable: true })
  @IsOptional()
  @IsUrl()
  coverImageUrl?: string;

  @ManyToMany(() => Category, category => category.books, { cascade: true, eager: true })
  @JoinTable({
    name: 'book_categories',
    joinColumn: { name: 'bookId', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'categoryId', referencedColumnName: 'id' }
  })
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => Category)
  @ArrayMinSize(1, { message: 'At least one category is required' })
  categories: Category[];

  @ManyToMany(() => Subject, subject => subject.books, { cascade: true, eager: true })
  @JoinTable({
    name: 'book_subjects',
    joinColumn: { name: 'bookId', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'subjectId', referencedColumnName: 'id' }
  })
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => Subject)
  subjects: Subject[];

  @ManyToOne(() => TypeEntity, (type) => type.books)
  @JoinColumn({ name: 'typeId' })
  type?: TypeEntity;

  @Column({
    type: 'int',
    nullable: true
  })
  typeId?: number;

  @ManyToOne(() => Source, (source) => source.books)
  @JoinColumn({ name: 'sourceId' })
  source?: Source;

  @Column({
    type: 'int',
    nullable: true
  })
  sourceId?: number;

  @Column({ nullable: true, name: 'ddc', unique: true })
  @IsOptional()
  @IsString()
  ddc?: string;

  @Column({ nullable: true })
  @IsOptional()
  price?: string;

  @Column({ nullable: true })
  @IsOptional()
  @IsUrl()
  ebookUrl?: string;

  @Column({ nullable: true })
  @IsOptional()
  @IsString()
  location?: string;
  @Column({ nullable: true })
  @IsOptional()
  @IsString()
  shelf?: string;

  @OneToMany(() => BookRequest, (request) => request.book)
  requests: BookRequest[];

  @OneToOne(() => BookMetadata, (metadata) => metadata.book, { cascade: true, eager: true })
  metadata: BookMetadata;

  @OneToMany('BookLoan', 'bookCopy')
  loans: BookLoan[];

  @OneToMany('QueueEntry', 'book')
  queueEntries: QueueEntry[];
  @Column({ type: 'int', default: 0 })
  queueCount: number;

  @Column('decimal', { precision: 3, scale: 2, default: 0 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(5)
  rating: number = 0;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @DeleteDateColumn({ name: 'deleted_at', nullable: true })
  deletedAt?: Date;

  @BeforeInsert()
  @BeforeUpdate()
  validateAvailableCopies() {
    if (this.availableCopies > this.totalCopies) {
      this.availableCopies = this.totalCopies;
    }
  }
}
