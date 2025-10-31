// import { DataSource } from 'typeorm';
// import { Book } from '../../books/entities/book.entity';
// import { BookCopy } from '../../books/entities/book-copy.entity';
// import { User } from '../../users/entities/user.entity';
// import { BookInhouseUsage } from '../../books/entities/book-inhouse-usage.entity';
// import { faker } from '@faker-js/faker';

// export async function seedInhouseUsage(dataSource: DataSource): Promise<void> {
//   console.log('Seeding in-house usage data...');
  
//   const bookRepository = dataSource.getRepository(Book);
//   const userRepository = dataSource.getRepository(User);
//   const copyRepository = dataSource.getRepository(BookCopy);
//   const usageRepository = dataSource.getRepository(BookInhouseUsage);

//   // Get some books and users to create relationships
//   const books = await bookRepository.find({ take: 10 });
//   const users = await userRepository.find({ 
//     where: { role: { name: 'student' } },
//     take: 5 
//   });

//   if (books.length === 0 || users.length === 0) {
//     console.warn('Not enough books or users found. Please seed books and users first.');
//     return;
//   }

//   const usages: Partial<BookInhouseUsage>[] = [];
  
//   // Generate 20-30 in-house usage records
//   const usageCount = faker.number.int({ min: 20, max: 30 });
  
//   for (let i = 0; i < usageCount; i++) {
//     const book = faker.helpers.arrayElement(books);
//     const user = faker.helpers.arrayElement(users);
    
//     // Get available copies for the book
//     const copies = await copyRepository.find({ 
//       where: { book: { id: book.id } },
//       take: 5
//     });
    
//     const copy = copies.length > 0 ? faker.helpers.arrayElement(copies) : null;
    
//     // Generate random start date within the last 30 days
//     const startedAt = faker.date.recent({ days: 30 });
    
//     // 80% chance the usage is completed
//     const isCompleted = faker.number.float() < 0.8;
//     let endedAt: Date | null = null;
//     let durationMinutes: number | null = null;
    
//     if (isCompleted) {
//       // Random duration between 15 minutes and 4 hours
//       const duration = faker.number.int({ min: 15, max: 240 });
//       endedAt = new Date(startedAt.getTime() + duration * 60 * 1000);
//       durationMinutes = duration;
//     }
    
//     const usage: Partial<BookInhouseUsage> = {
//       book: { id: book.id },
//       user: { id: user.id },
//       copy: copy ? { id: copy.id } : undefined,
//       startedAt,
//       endedAt,
//       durationMinutes
//     };
    
//     usages.push(usage);
//   }
  
//   // Save all usages in a transaction
//   await dataSource.transaction(async (transactionalEntityManager) => {
//     for (const usage of usages) {
//       const newUsage = new BookInhouseUsage();
//       Object.assign(newUsage, usage);
//       await transactionalEntityManager.save(newUsage);
//     }
//   });
  
//   console.log(`Successfully seeded ${usages.length} in-house usage records`);
// }
