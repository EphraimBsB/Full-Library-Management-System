import { DataSource } from 'typeorm';
import { ISeeder, SeedResult } from '../base-seed.interface';
import { faker } from '@faker-js/faker';
import { BookNote } from 'src/books/entities/book-note.entity';
import { Book } from 'src/books/entities/book.entity';
import { User } from 'src/users/entities/user.entity';

export class BookNotesSeed implements ISeeder {
  public async run(dataSource: DataSource): Promise<SeedResult> {
    console.log('Seeding book notes...');
    
    const bookNoteRepository = dataSource.getRepository(BookNote);
    const bookRepository = dataSource.getRepository(Book);
    const userRepository = dataSource.getRepository(User);

    // Get all books and users
    const books = await bookRepository.find({ take: 50 });
    const users = await userRepository.find({ take: 20 });

    if (books.length === 0 || users.length === 0) {
      console.warn('Not enough books or users found to create notes. Skipping...');
      return { entity: 'BookNotes', count: 0 };
    }

    const notes: Partial<BookNote>[] = [];
    const notesPerUser = 5; // Number of notes per user

    // Generate notes for each user
    for (const user of users) {
      // Select random books for this user
      const userBooks = faker.helpers.arrayElements(
        books,
        faker.number.int({ min: 1, max: notesPerUser })
      );

      for (const book of userBooks) {
        const isPublic = faker.datatype.boolean({ probability: 0.7 }); // 70% chance of being public
        const hasPageNumber = faker.datatype.boolean({ probability: 0.6 }); // 60% chance of having a page number
        
        notes.push({
          content: faker.lorem.paragraphs(faker.number.int({ min: 1, max: 3 })),
          pageNumber: hasPageNumber ? faker.number.int({ min: 1, max: 500 }) : undefined,
          isPublic,
          userId: user.id,
          bookId: book.id,
          createdAt: faker.date.past({ years: 1 }),
          updatedAt: faker.date.recent({ days: 30 })
        });
      }
    }

    try {
      await bookNoteRepository.save(notes);
      console.log(`Successfully seeded ${notes.length} book notes`);
      return { entity: 'BookNotes', count: notes.length };
    } catch (error) {
      console.error('Error seeding book notes:', error);
      return { entity: 'BookNotes', count: 0, error };
    }
  }
}
