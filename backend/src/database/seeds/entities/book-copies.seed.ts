import { DataSource } from 'typeorm';
import { ISeeder, SeedResult } from '../base-seed.interface';
import { BookCopy, BookCopyStatus } from '../../../books/entities/book-copy.entity';
import { Book } from '../../../books/entities/book.entity';
import { faker } from '@faker-js/faker';

type CopyStatus = 'available' | 'on_loan' | 'lost' | 'damaged' | 'in_repair';

interface CopyData {
  barcode: string;
  status: CopyStatus;
  acquisitionDate: Date;
  notes?: string;
  condition?: 'new' | 'good' | 'fair' | 'poor' | 'withdrawn';
  lastInventoryDate?: Date;
  location?: string;
  shelf?: string;
}

export class BookCopiesSeed implements ISeeder {
  private generateBarcode(bookId: string, copyNumber: number): string {
    return `BK-${bookId.padStart(5, '0')}-${copyNumber.toString().padStart(3, '0')}`;
  }

  private generateAccessNumber(bookId: string, copyNumber: number): string {
    return `AC-${bookId.padStart(5, '0')}-${copyNumber.toString().padStart(3, '0')}`;
  }

  private generateCopyData(
    book: Book, 
    copyNumber: number, 
    status: CopyStatus = 'available'
  ): CopyData {
    const isAvailable = status === 'available';
    const acquisitionDate = faker.date.past({ years: 5 });
    const lastInventoryDate = faker.date.between({
      from: acquisitionDate,
      to: new Date()
    });
    
    const conditions = ['new', 'good', 'fair', 'poor', 'withdrawn'] as const;
    const condition = faker.helpers.arrayElement(conditions);
    
    const locations = [
      'Main Stacks', 'Reference', 'Reserves', 'Special Collections',
      'Oversize', 'New Arrivals', 'Bestsellers'
    ];
    
    const location = faker.helpers.arrayElement(locations);
    const shelf = `${faker.helpers.arrayElement(['A', 'B', 'C', 'D'])}-${faker.number.int({ min: 1, max: 50 })}`;
    
    const statusNotes = {
      available: 'Available for borrowing',
      on_loan: `Due ${faker.date.soon({ days: 14 }).toLocaleDateString()}`,
      lost: 'Reported lost',
      damaged: 'Damaged - requires repair or replacement',
      in_repair: 'Being repaired - expected back soon'
    };
    
    const conditionNotes = {
      new: 'Like new condition',
      good: 'Shows minor wear',
      fair: 'Shows moderate wear',
      poor: 'Heavily used',
      withdrawn: 'To be withdrawn from collection'
    };

    return {
      barcode: this.generateBarcode(book.id.toString(), copyNumber),
      status,
      acquisitionDate,
      condition,
      lastInventoryDate,
      location,
      shelf,
      notes: [
        `Copy ${copyNumber} of ${book.title}`,
        statusNotes[status],
        `Condition: ${condition} - ${conditionNotes[condition]}`,
        faker.helpers.maybe(() => `Note: ${faker.lorem.sentence()}`, { probability: 0.3 })
      ].filter(Boolean).join('\n')
    };
  }

  public async run(dataSource: DataSource): Promise<SeedResult> {
    console.log('Seeding book copies...');
    const bookCopyRepository = dataSource.getRepository(BookCopy);
    const bookRepository = dataSource.getRepository(Book);
    const results: string[] = [];

    // Get all books with their current copies
    const books = await bookRepository.find({
      relations: ['copies'],
      order: { id: 'ASC' }
    });

    if (!books.length) {
      const message = 'No books found. Please seed books first.';
      console.warn(message);
      results.push(message);
      return { 
        entity: 'BookCopy', 
        count: 0,
        details: results
      };
    }

    let created = 0;
    let updated = 0;
    const batchSize = 50;
    
    // Process books in batches
    for (let i = 0; i < books.length; i += batchSize) {
      const batch = books.slice(i, i + batchSize);
      
      for (const book of batch) {
        try {
          const existingCopies = book.copies || [];
          const totalCopies = book.totalCopies || 1;
          const availableCopies = book.availableCopies || 0;
          
          // Skip if we already have the correct number of copies
          if (existingCopies.length === totalCopies) {
            results.push(`Skipping book ID ${book.id}: Already has ${totalCopies} copies`);
            continue;
          }

          // Calculate how many new copies to create
          const newCopiesNeeded = Math.max(0, totalCopies - existingCopies.length);
          
          if (newCopiesNeeded === 0) {
            results.push(`No new copies needed for book ID ${book.id}`);
            continue;
          }

          // Determine status distribution for new copies
          const availableToAdd = Math.max(0, availableCopies - 
            existingCopies.filter(c => c.status === BookCopyStatus.AVAILABLE).length
          );
          
          const newCopies: BookCopy[] = [];
          
          // Create available copies first
          for (let i = 0; i < Math.min(availableToAdd, newCopiesNeeded); i++) {
            const copyNumber = existingCopies.length + newCopies.length + 1;
            const copyData = this.generateCopyData(book, copyNumber, 'available');
            
            const newCopy = bookCopyRepository.create({
              book: { id: book.id },  // Use book relation instead of bookId
              accessNumber: this.generateAccessNumber(book.id.toString(), copyNumber),
              status: BookCopyStatus.AVAILABLE,
              isActive: true,
              notes: copyData.notes
            });
            
            newCopies.push(newCopy);
          }
          
          // Create unavailable copies
          const remainingToAdd = newCopiesNeeded - newCopies.length;
          if (remainingToAdd > 0) {
            const statuses: BookCopyStatus[] = [
              BookCopyStatus.BORROWED,
              BookCopyStatus.IN_REPAIR,
              BookCopyStatus.LOST,
              BookCopyStatus.DAMAGED
            ];
            
            for (let i = 0; i < remainingToAdd; i++) {
              const copyNumber = existingCopies.length + newCopies.length + 1;
              const status = faker.helpers.arrayElement(statuses);
              const copyData = this.generateCopyData(book, copyNumber, status.toLowerCase() as CopyStatus);
              
              const newCopy = bookCopyRepository.create({
                book: { id: book.id },  // Use book relation instead of bookId
                accessNumber: this.generateAccessNumber(book.id.toString(), copyNumber),
                status,
                isActive: status !== BookCopyStatus.LOST && status !== BookCopyStatus.WITHDRAWN,
                notes: copyData.notes
              });
              
              newCopies.push(newCopy);
            }
          }
          
          // Save new copies in batches
          if (newCopies.length > 0) {
            await bookCopyRepository.save(newCopies, { chunk: 50 });
            created += newCopies.length;
            results.push(`Added ${newCopies.length} copies for book ID ${book.id}: "${book.title}"`);
          }
          
          // Update book's available copies count if needed
          if (book.availableCopies !== availableCopies) {
            book.availableCopies = availableCopies;
            await bookRepository.save(book);
            updated++;
          }
          
        } catch (error) {
          const errorMsg = `Error processing book ID ${book.id}: ${error.message}`;
          console.error(errorMsg, error);
          results.push(errorMsg);
        }
      }
    }

    // Log summary
    const summary = `Created ${created} book copies and updated ${updated} books`;
    console.log(summary);
    results.push(summary);

    return {
      entity: 'BookCopy',
      count: created,
      details: results
    };
  }
}
