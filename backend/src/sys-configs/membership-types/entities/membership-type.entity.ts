import { Membership } from 'src/membership/entities/membership.entity';
import { Entity, Column, OneToMany, PrimaryGeneratedColumn } from 'typeorm';

@Entity('membership_types')
export class MembershipType {
  @PrimaryGeneratedColumn('increment')
  id: number;

  @Column({ type: 'varchar', length: 100 })
  name: string;

  @Column({ type: 'int', default: 3 })
  maxBooks: number;

  @Column({ name: 'max_duration_days', type: 'int', default: 14 })
  maxDurationDays: number;

  @Column({ name: 'loan_period_days', type: 'int', default: 14 })
  loanPeriodDays: number;

  @Column({ name: 'renewal_limit', type: 'int', default: 1 })
  renewalLimit: number;

  @Column({
    name: 'fine_rate',
    type: 'decimal',
    precision: 10,
    scale: 2,
    default: 1.0,
  })
  fineRate: number;

  @Column({ name: 'grace_period_days', type: 'int', default: 0 })
  gracePeriodDays: number;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'boolean', default: true })
  isActive: boolean;

  @OneToMany(() => Membership, (membership) => membership.type, {
    cascade: true,
  })
  memberships: Membership[];
}
