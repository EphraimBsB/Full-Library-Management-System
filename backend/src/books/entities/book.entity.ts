import { 
  Entity, 
  PrimaryGeneratedColumn, 
  Column, 
  CreateDateColumn, 
  UpdateDateColumn, 
  DeleteDateColumn,
  Index,
  BeforeInsert,
  BeforeUpdate,
  ManyToMany,
  OneToMany,
  JoinTable
} from 'typeorm';
import { IsString, IsOptional, IsInt, IsArray, IsUrl, IsEnum, IsNumber, Min, Max, IsDateString, IsISBN, ValidateNested, ArrayMinSize } from 'class-validator';
import { Type } from 'class-transformer';
import { BookType, BookSource } from '../enums/book-type.enum';
import { Category } from './category.entity';
import { Subject } from './subject.entity';
import { AccessNumber } from './access-number.entity';
import { BorrowedBook } from './borrowed-book.entity';
import { BookRequest } from './book-request.entity';

@Entity('books')
@Index(['title', 'author'])
@Index(['publicationYear'])
@Index(['type'])
@Index(['availableCopies'])
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

  @Column({
    type: 'enum',
    enum: BookType,
    default: BookType.PHYSICAL
  })
  @IsEnum(BookType)
  type: BookType = BookType.PHYSICAL;

  @Column({
    type: 'enum',
    enum: BookSource,
    nullable: true
  })
  @IsOptional()
  @IsEnum(BookSource)
  source?: BookSource;

  @Column({ nullable: true, name: 'ddc', unique: true })
  @IsOptional()
  @IsString()
  ddc?: string; // Dewey Decimal Classification

  @Column({ nullable: true })
  @IsOptional()
  @IsString()
  from?: string; // Source of the book (if donation, gift, etc.)

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

  @OneToMany(() => AccessNumber, (accessNumber) => accessNumber.book)
  @ValidateNested({ each: true })
  @Type(() => AccessNumber)
  accessNumbers: AccessNumber[];

  @OneToMany(() => BookRequest, (request) => request.book)
  requests: BookRequest[];

  @OneToMany(() => BorrowedBook, borrowedBook => borrowedBook.book)
  borrowedBy: BorrowedBook[];

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
