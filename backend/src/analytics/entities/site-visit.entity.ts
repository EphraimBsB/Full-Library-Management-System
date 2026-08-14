import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, Index } from 'typeorm';

@Entity('site_visits')
export class SiteVisit {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @Column({ nullable: true })
  sessionId: string;

  @Column({ nullable: true })
  ipAddress: string;

  @Index()
  @Column({ length: 255, nullable: true })
  pageVisited: string;

  @Column('text', { nullable: true })
  userAgent: string;

  @Column('text', { nullable: true })
  searchQuery: string;

  @Column('int', { nullable: true })
  resultsCount: number;

  @Column('int', { nullable: true, default: 0 })
  duration: number;


  @Index()
  @CreateDateColumn()
  visitedAt: Date;
}
