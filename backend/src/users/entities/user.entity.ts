import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, DeleteDateColumn, Index, BeforeInsert, BeforeUpdate, OneToMany } from 'typeorm';
import { Exclude } from 'class-transformer';
import { UserRole } from '../../common/enums/user-role.enum';
import { BorrowedBook } from '../../books/entities/borrowed-book.entity';
import { BookRequest } from '../../books/entities/book-request.entity';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'first_name' })
  firstName: string;

  @Column({ name: 'last_name' })
  lastName: string;

  @Column({ unique: true })
  email: string;

  @Column({ name: 'roll_number', unique: true })
  rollNumber: string;

  @Column({ name: 'phone_number', nullable: true })
  phoneNumber?: string;

  @Column({ name: 'profile_image_url', nullable: true })
  profileImageUrl?: string;

  @Column({ nullable: true })
  course?: string;

  @Column({ nullable: true })
  degree?: string;

  @Column({ name: 'date_of_birth', type: 'date', nullable: true })
  dateOfBirth?: Date;

  @Column({ 
    type: 'enum',
    enum: UserRole,
    default: UserRole.MEMBER 
  })
  role: UserRole;

  @Column({ name: 'is_active', default: true })
  isActive: boolean;

  @Column({ name: 'join_date', type: 'timestamp' })
  joinDate: Date;

  @Column({ name: 'expiry_date', type: 'timestamp', nullable: true })
  expiryDate?: Date;

  @Column({ name: 'password_hash' })
  @Exclude()
  passwordHash: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @DeleteDateColumn({ name: 'deleted_at', nullable: true })
  @Exclude()
  deletedAt?: Date;

  @OneToMany(() => BorrowedBook, (borrowedBook) => borrowedBook.user)
  borrowedBooks: BorrowedBook[];

  @OneToMany(() => BookRequest, (request) => request.user)
  bookRequests: BookRequest[];

  @BeforeInsert()
  @BeforeUpdate()
  emailToLowerCase() {
    this.email = this.email.toLowerCase();
  }

  // Add any additional methods or relationships here
  get fullName(): string {
    return `${this.firstName} ${this.lastName}`;
  }
}
