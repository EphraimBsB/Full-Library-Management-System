import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity('loan_settings')
export class LoanSettings {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ 
    type: 'boolean',
    default: false,
    comment: 'Whether to automatically approve loans when a book becomes available from queue'
  })
  autoApproveQueueLoans: boolean;

  @Column({ 
    type: 'int',
    default: 24,
    comment: 'Number of hours a user has to pick up a book after it becomes available'
  })
  queueHoldDurationHours: number;
}
