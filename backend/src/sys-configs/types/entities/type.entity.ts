import { Book } from "src/books/entities/book.entity";
import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from "typeorm";

export enum BookFormat {
  PHYSICAL = 'physical',
  DIGITAL = 'digital',
}

@Entity('types')
export class Type {
  @PrimaryGeneratedColumn('increment')
  id: number;

  @Column({ type: 'varchar', length: 50 })
  name: string;

  @Column({
    type: 'enum',
    enum: BookFormat,
    default: BookFormat.PHYSICAL
  })
  format: BookFormat;

  @Column({ type: 'text', nullable: true })
  description: string;

  @OneToMany(() => Book, (book) => book.type)
  books: Book[];

  @Column({ type: 'boolean', default: true })
  isActive: boolean;
}

