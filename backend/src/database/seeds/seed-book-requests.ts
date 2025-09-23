import { DataSource, QueryRunner } from 'typeorm';
import { BookRequest, RequestStatus } from '../../books/entities/book-request.entity';
import { Book } from '../../books/entities/book.entity';
import { User } from '../../users/entities/user.entity';

export class BookRequestSeeder {
  constructor(private dataSource: DataSource) {}

  async seed(queryRunner: QueryRunner, users: any[], books: any[]): Promise<BookRequest[]> {
    // Reset auto-increment counter
    await queryRunner.query('ALTER TABLE book_requests AUTO_INCREMENT = 1');

    const bookRequestRepository = this.dataSource.getRepository(BookRequest);
    const requests: BookRequest[] = [];

    // Use the provided users and books if available, otherwise fetch from database
    const bookEntities = books.length > 0 ? books : await this.dataSource.getRepository(Book).find();
    const userEntities = users.length > 0 ? users : await this.dataSource.getRepository(User).find();

    // If no books or users, log and return empty array
    if (bookEntities.length === 0 || userEntities.length === 0) {
      console.log('⚠️  No books or users found. Skipping book requests seeding.');
      return [];
    }

    // Create book requests for each user and book combination
    for (const user of userEntities) {
      // Only create requests for some users to make it more realistic
      if (Math.random() > 0.3) { // 70% chance of creating requests for a user
        // Select a random number of books for this user (1 to 3 books)
        const numBooks = Math.min(1 + Math.floor(Math.random() * 3), bookEntities.length);
        const shuffledBooks = [...bookEntities].sort(() => 0.5 - Math.random());
        const userBooks = shuffledBooks.slice(0, numBooks);

        for (const book of userBooks) {
          const bookRequest = new BookRequest();
          bookRequest.book = book as Book;
          bookRequest.bookId = book.id;
          bookRequest.user = user as User;
          bookRequest.userId = user.id;
          bookRequest.status = RequestStatus.PENDING;
          bookRequest.fulfilledAt = Math.random() > 0.8 ? new Date() : null;
          bookRequest.createdAt = new Date();
          bookRequest.updatedAt = new Date();
          
          const savedRequest = await bookRequestRepository.save(bookRequest);
          requests.push(savedRequest);
        }
      }
    }

    console.log(`✅ Created ${requests.length} book requests`);
    return requests;
  }
}
