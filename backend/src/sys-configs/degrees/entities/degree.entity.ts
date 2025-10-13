import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';

export enum DegreeLevel {
  DIPLOMA = 'diploma',
  BACHELORS = 'bachelors',
  MASTERS = 'masters',
  PHD = 'phd',
  CERTIFICATE = 'certificate',
}

@Entity('degrees')
export class Degree {
  @PrimaryGeneratedColumn('increment')
  id: number;

  @Column({ type: 'varchar', length: 255 })
  name: string;

  @Column({ type: 'varchar', length: 10 })
  code: string;

  @Column({
    type: 'enum',
    enum: DegreeLevel,
    default: DegreeLevel.BACHELORS
  })
  level: DegreeLevel;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'boolean', default: true })
  isActive: boolean;

}
