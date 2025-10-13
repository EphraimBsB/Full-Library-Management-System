import { DataSource } from 'typeorm';
import { ISeeder, SeedResult } from '../base-seed.interface';
import { QueueEntry, QueueStatus } from '../../../books/entities/queue-entry.entity';
import { Book } from '../../../books/entities/book.entity';
import { User } from '../../../users/entities/user.entity';

export class QueueEntriesSeed implements ISeeder {
  public async run(dataSource: DataSource): Promise<SeedResult> {
    console.log('Seeding queue entries...');
    const queueEntryRepository = dataSource.getRepository(QueueEntry);
    const bookRepository = dataSource.getRepository(Book);
    const userRepository = dataSource.getRepository(User);

    // Get books with queue count > 0
    const books = await bookRepository
      .createQueryBuilder('book')
      .where('book.queueCount > 0')
      .getMany();

    // Get regular users (non-admins)
    const users = await userRepository.find({
      where: { role: { name: 'Member' } },
      take: 10 // Limit to first 10 members
    });

    if (books.length === 0 || users.length === 0) {
      console.warn('No books with queue or users found. Please seed books and users first.');
      return { entity: 'QueueEntry', count: 0 };
    }

    const entries: QueueEntry[] = [];
    
    // Create queue entries for books with queue count
    for (const book of books) {
      const queueSize = Math.min(book.queueCount, 5); // Max 5 entries per queue
      
      for (let i = 0; i < queueSize; i++) {
        const user = users[i % users.length];
        const joinDate = new Date();
        joinDate.setDate(joinDate.getDate() - (queueSize - i)); // Stagger join dates

        // Create a new QueueEntry instance
        const entry = new QueueEntry();
        
        // Set the relationships
        entry.book = book;
        entry.user = user;
        
        // Set the properties
        entry.position = i + 1;
        entry.status = QueueStatus.WAITING; // All start as waiting
        entry.readyAt = i === 0 ? new Date() : null; // First in queue is ready
        entry.expiresAt = new Date();
        entry.expiresAt.setDate(entry.expiresAt.getDate() + 7); // Expires in 7 days
        
        // Set timestamps
        entry.createdAt = joinDate;
        entry.updatedAt = joinDate;

        entries.push(entry);
      }
    }

    let created = 0;
    if (entries.length > 0) {
      await queueEntryRepository.save(entries);
      created = entries.length;
    }

    return {
      entity: 'QueueEntry',
      count: created
    };
  }
}
