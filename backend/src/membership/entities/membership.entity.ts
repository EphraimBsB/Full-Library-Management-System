import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn, UpdateDateColumn, OneToMany, OneToOne } from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { BookLoan } from '../../books/entities/book-loan.entity';
import { MembershipType } from 'src/sys-configs/membership-types/entities/membership-type.entity';
import { MembershipRequest } from './membership-request.entity';

export enum MembershipStatus {
  ACTIVE = 'active',
  EXPIRED = 'expired',
  SUSPENDED = 'suspended',
  CANCELLED = 'cancelled'
}

@Entity('memberships')
export class Membership {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('varchar', { length: 20, unique: true })
  membershipNumber: string;

  @Column('uuid')
  userId: string;

  @ManyToOne(() => User, user => user.memberships, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User;

  @OneToOne(() => MembershipRequest, { nullable: true })
  @JoinColumn({ name: 'requestId' })
  request: MembershipRequest | null;

  @Column('uuid', { nullable: true })
  requestId: string | null;

  @Column('int')
  membershipTypeId: number;

  @ManyToOne(() => MembershipType, { eager: true })
  @JoinColumn({ name: 'membershipTypeId' })
  type: MembershipType;

  @Column('date')
  startDate: Date;

  @Column('date')
  expiryDate: Date;

  @Column({
    type: 'enum',
    enum: MembershipStatus,
    default: MembershipStatus.ACTIVE
  })
  status: MembershipStatus;

  @Column('int', { default: 0 })
  timesRenewed: number;

  @Column('decimal', { precision: 10, scale: 2, default: 0 })
  outstandingFines: number;

  @OneToMany(() => BookLoan, loan => loan.membership)
  loans: BookLoan[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  isActive(): boolean {
    const now = new Date();
    return this.status === MembershipStatus.ACTIVE && 
           new Date(this.expiryDate) >= now;
  }

  canBorrowMoreBooks(currentLoans: number): boolean {
    return currentLoans < this.type.maxBooks;
  }

  canRenew(currentRenewals: number): boolean {
    return currentRenewals < this.type.maxDurationDays;
  }
}
