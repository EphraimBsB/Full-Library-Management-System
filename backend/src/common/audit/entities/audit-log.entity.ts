import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, CreateDateColumn, Index } from 'typeorm';
import { User } from '../../../users/entities/user.entity';

export enum AuditAction {
  CREATE = 'CREATE',
  UPDATE = 'UPDATE',
  DELETE = 'DELETE',
  LOGIN = 'LOGIN',
  LOGOUT = 'LOGOUT',
  ACCESS = 'ACCESS',
  DOWNLOAD = 'DOWNLOAD',
  BORROW = 'BORROW',
  RETURN = 'RETURN',
  RENEW = 'RENEW',
  RESERVE = 'RESERVE',
  CANCEL_RESERVATION = 'CANCEL_RESERVATION',
  APPROVE = 'APPROVE',
  REJECT = 'REJECT',
  SYSTEM = 'SYSTEM'
}

@Entity('audit_logs')
@Index(['entityType', 'entityId'])
@Index(['action'])
@Index(['performedById'])
@Index(['performedAt'])
export class AuditLog {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 100 })
  entityType: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  entityId: string;

  @Column({ type: 'enum', enum: AuditAction })
  action: AuditAction;

  @Column({ type: 'json', nullable: true })
  oldValue: Record<string, any>;

  @Column({ type: 'json', nullable: true })
  newValue: Record<string, any>;

  @Column({ type: 'text', nullable: true })
  ipAddress: string;

  @Column({ type: 'text', nullable: true })
  userAgent: string;

  @ManyToOne(() => User, { nullable: true, onDelete: 'SET NULL' })
  @Column({ type: 'uuid', nullable: true })
  performedById: string;

  @ManyToOne(() => User, { nullable: true })
  performedBy: User;

  @CreateDateColumn({ type: 'timestamp' })
  performedAt: Date;

  @Column({ type: 'text', nullable: true })
  reason: string;

  @Column({ type: 'boolean', default: false })
  isSuccessful: boolean;

  @Column({ type: 'text', nullable: true })
  error: string;

  @Column({ type: 'json', nullable: true })
  metadata: Record<string, any>;
}
