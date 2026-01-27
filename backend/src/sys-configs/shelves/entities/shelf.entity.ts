import {
  Column,
  DeleteDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Location } from '../../locations/entities/location.entity';

@Entity('shelves')
export class Shelf {
  @PrimaryGeneratedColumn('increment')
  id: number;

  @Column({ type: 'varchar', length: 150 })
  name: string;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @ManyToOne(() => Location, (location) => location.shelves, { eager: true })
  @JoinColumn({ name: 'locationId' })
  location: Location;

  @Column({ type: 'int' })
  locationId: number;

  @Column({ type: 'boolean', default: true })
  isActive: boolean;

  @DeleteDateColumn({ name: 'deleted_at', nullable: true })
  deletedAt?: Date;
}
