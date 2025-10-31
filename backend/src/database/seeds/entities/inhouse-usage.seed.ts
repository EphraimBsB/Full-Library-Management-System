import { DataSource } from 'typeorm';
import { Book } from '../../../books/entities/book.entity';
import { BookCopy } from '../../../books/entities/book-copy.entity';
import { User } from '../../../users/entities/user.entity';
import { BookInhouseUsage, InhouseUsageStatus } from '../../../books/entities/book-inhouse-usage.entity';
import { faker } from '@faker-js/faker';
import { ISeeder, SeedResult } from '../base-seed.interface';

export class InhouseUsageSeed implements ISeeder {
  name = 'BookInhouseUsage';
  order = 90; // Run after books and users

  async run(dataSource: DataSource): Promise<SeedResult> {
    console.log(`[${this.name}] Seeding in-house usage data...`);
    
    const bookRepository = dataSource.getRepository(Book);
    const userRepository = dataSource.getRepository(User);
    const copyRepository = dataSource.getRepository(BookCopy);
    const usageRepository = dataSource.getRepository(BookInhouseUsage);

    // Get some books and users to create relationships
    const books = await bookRepository.find({ take: 10 });
    const users = await userRepository.find({ 
      where: { role: { name: 'student' } },
      take: 5 
    });

    if (books.length === 0 || users.length === 0) {
      console.warn('Not enough books or users found. Please seed books and users first.');
      return { entity: this.name, count: 0 };
    }

    const usages: Partial<BookInhouseUsage>[] = [];
    
    // Generate 20-30 in-house usage records
    const usageCount = faker.number.int({ min: 20, max: 30 });
    
    for (let i = 0; i < usageCount; i++) {
      const book = faker.helpers.arrayElement(books);
      const user = faker.helpers.arrayElement(users);
      
      // Get available copies for the book
      const copies = await copyRepository.find({ 
        where: { book: { id: book.id } },
        take: 5
      });
      
      const copy = copies.length > 0 ? faker.helpers.arrayElement(copies) : null;
      
      // Generate random start date within the last 30 days
      const startedAt = faker.date.recent({ days: 30 });
      
      // 5% chance of being cancelled, 75% completed, 20% still active
      const statusRoll = faker.number.float();
      let status: InhouseUsageStatus;
      let endedAt: Date | null = null;
      let durationMinutes: number | null = null;
      
      if (statusRoll < 0.05) {
        // 5% cancelled
        status = InhouseUsageStatus.CANCELLED;
      } else if (statusRoll < 0.8) {
        // 75% completed
        status = InhouseUsageStatus.COMPLETED;
        const duration = faker.number.int({ min: 15, max: 240 });
        endedAt = new Date(startedAt.getTime() + duration * 60 * 1000);
        durationMinutes = duration;
      } else {
        // 20% still active
        status = InhouseUsageStatus.ACTIVE;
      }
      
      const usage: Partial<BookInhouseUsage> = {
        book: { id: book.id } as any,
        user: { id: user.id } as any,
        copy: copy ? { id: copy.id } as any : null,
        startedAt,
        endedAt,
        durationMinutes,
        status
      };
      
      usages.push(usage);
    }
    
    // Save all usages in a transaction
    const savedUsages = await dataSource.transaction(async (transactionalEntityManager) => {
      const saved: BookInhouseUsage[] = [];
      for (const usage of usages) {
        const newUsage = new BookInhouseUsage();
        Object.assign(newUsage, usage);
        const savedUsage = await transactionalEntityManager.save(newUsage);
        saved.push(savedUsage);
      }
      return saved;
    });
    
    console.log(`[${this.name}] Successfully seeded ${savedUsages.length} in-house usage records`);
    return { entity: this.name, count: savedUsages.length };
  }
}
