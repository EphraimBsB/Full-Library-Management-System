import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn } from 'typeorm';

@Entity('site_visits')
export class SiteVisit {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ nullable: true })
  sessionId: string;

  @Column({ nullable: true })
  ipAddress: string;

  @Column({ nullable: true })
  pageVisited: string;

  @Column({ nullable: true })
  userAgent: string;

  @Column({ nullable: true })
  searchQuery: string;

  @Column('int', { nullable: true })
  resultsCount: number;

  @Column('int', { nullable: true, default: 0 })
  duration: number;


  @CreateDateColumn()
  visitedAt: Date;
}
