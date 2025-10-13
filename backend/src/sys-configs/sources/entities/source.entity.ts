import { Book } from 'src/books/entities/book.entity';
import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';

@Entity('sources')
export class Source {
    @PrimaryGeneratedColumn('increment')
    id: number;
    
    @Column({ type: 'varchar', length: 100 })
    name: string;

    @Column({ type: 'varchar', length: 255, nullable: true })
    supplier: string;

    @Column({ name: 'date_acquired', type: 'date', nullable: true })
    dateAcquired: Date;

    @Column({ type: 'boolean', default: true })
    isActive: boolean;

    @OneToMany(() => Book, (book) => book.source)
    books: Book[];
}
