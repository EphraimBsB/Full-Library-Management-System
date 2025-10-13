import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, DeleteDateColumn, BeforeInsert, BeforeUpdate, OneToMany, ManyToOne, JoinColumn } from 'typeorm';
import { Exclude } from 'class-transformer';
import { UserRole } from '../../sys-configs/user-roles/entities/user-role.entity';
import { BookLoan } from '../../books/entities/book-loan.entity';
import { QueueEntry } from '../../books/entities/queue-entry.entity';
import { BookRequest } from 'src/books/entities/book-request.entity';
import { Membership } from 'src/membership/entities/membership.entity';
import { MembershipRequest } from 'src/membership/entities/membership-request.entity';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'avatar_url', nullable: true })
  avatarUrl?: string;

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

  @Column({ nullable: true })
  degree?: string;

  @Column({ name: 'date_of_birth', type: 'date', nullable: true })
  dateOfBirth?: Date;

  @ManyToOne(() => UserRole, (userRole) => userRole.users, { 
    eager: true,
    nullable: false
  })
  @JoinColumn({ 
    name: 'role_id',
    referencedColumnName: 'id'
  })
  role: UserRole;

  @Column({ name: 'role_id' })
  roleId: number;

  @Column({ name: 'join_date', type: 'datetime', default: () => 'CURRENT_TIMESTAMP' })
  joinDate: Date;

  @Column({ name: 'is_active', default: false })
  isActive: boolean = false;

  @Column({ name: 'expiry_date', type: 'timestamp', nullable: true })
  expiryDate?: Date;

  @Column({ name: 'password_hash', nullable: false })
  @Exclude()
  passwordHash: string;

  // Helper method to check if user is currently active
  isCurrentlyActive(): boolean {
    return this.isActive && (!this.expiryDate || new Date(this.expiryDate) > new Date());
  }

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })

  @DeleteDateColumn({ name: 'deleted_at', nullable: true })
  @Exclude()
  deletedAt?: Date;

  @OneToMany(() => BookRequest, bookRequest => bookRequest.user)
  bookRequests: BookRequest[];

  @OneToMany(() => BookLoan, loan => loan.user)
  bookLoans: BookLoan[];

  @OneToMany(() => QueueEntry, queueEntry => queueEntry.user)
  queueEntries: QueueEntry[];

  @OneToMany(() => Membership, membership => membership.user, { eager: true })
  memberships: Membership[];

  @OneToMany(() => MembershipRequest, request => request.user)
  membershipRequests: MembershipRequest[];

  @Column({ type: 'int', default: 0 })
  activeLoansCount: number;

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
