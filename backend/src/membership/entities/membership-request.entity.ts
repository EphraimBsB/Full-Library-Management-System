import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn, UpdateDateColumn, OneToOne } from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { MembershipType } from 'src/sys-configs/membership-types/entities/membership-type.entity';
import { Membership } from './membership.entity';

export enum MembershipRequestStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected'
}

@Entity('membership_requests')
export class MembershipRequest {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid')
  userId: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column('int')
  membershipTypeId: number;

  @ManyToOne(() => MembershipType, { eager: true })
  @JoinColumn({ name: 'membershipTypeId' })
  membershipType: MembershipType;

  @OneToOne(() => Membership, membership => membership.request, { nullable: true })
  membership: Membership | null;

  @Column({
    type: 'enum',
    enum: MembershipRequestStatus,
    default: MembershipRequestStatus.PENDING
  })
  status: MembershipRequestStatus;

  @Column('text', { nullable: true })
  rejectionReason: string | null;

  @Column('uuid', { nullable: true })
  processedById: string | null;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'processedById' })
  processedBy: User | null;

  @Column('timestamp', { nullable: true })
  processedAt: Date | null;

  @Column('text', { nullable: true })
  notes: string | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
