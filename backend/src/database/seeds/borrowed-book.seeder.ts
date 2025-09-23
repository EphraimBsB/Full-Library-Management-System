import { DataSource, In, MoreThan, QueryRunner } from 'typeorm';
import { BorrowedBook, BorrowedBookStatus } from '../../books/entities/borrowed-book.entity';
import { Book } from '../../books/entities/book.entity';
import { User } from '../../users/entities/user.entity';
import { AccessNumber } from '../../books/entities/access-number.entity';
import { UserRole } from '../../common/enums/user-role.enum';

export class BorrowedBookSeeder {
  constructor(private dataSource: DataSource) {}

  async seed(queryRunner: QueryRunner) {
    // Get some books and users
    const bookRepo = this.dataSource.getRepository(Book);
    const userRepo = this.dataSource.getRepository(User);
    const borrowedBookRepo = this.dataSource.getRepository(BorrowedBook);

    // Get all books with their access numbers
    const books = await bookRepo.find({ 
      relations: ['accessNumbers'],
      where: { availableCopies: MoreThan(0) }
    });
    
    // Get all member users
    const users = await userRepo.find({ 
      where: { role: UserRole.MEMBER },
      take: 20 // Limit number of users to avoid too many records
    });

    if (books.length === 0 || users.length === 0) {
      console.log('⚠️ No books with available copies or member users found. Please seed them first.');
      return [];
    }

    const now = new Date();
    const borrowedBooks: BorrowedBook[] = [];
    
    // For each user, borrow some books
    for (const user of users) {
      // Random number of books to borrow (1-3 per user)
      const numBooks = Math.min(Math.floor(Math.random() * 3) + 1, books.length);
      
      // Get random books that have available copies
      const booksToBorrow = this.getRandomItems(books, 1, numBooks);

      for (const book of booksToBorrow) {
        // Find an available access number for this book that's not currently borrowed
        const accessNumber = await this.dataSource
          .createQueryBuilder()
          .select('access_number')
          .from(AccessNumber, 'access_number')
          .leftJoin(
            'borrowed_books', 
            'bb', 
            'bb.access_number_id = access_number.id AND bb.returnedAt IS NULL'
          )
          .where('access_number.bookId = :bookId', { bookId: book.id })
          .andWhere('bb.id IS NULL')
          .getOne();
        
        if (!accessNumber) {
          console.log(`No available access numbers for book ${book.title}`);
          continue;
        }

        // Random borrow date in the last 30 days
        const borrowDate = new Date();
        borrowDate.setDate(now.getDate() - Math.floor(Math.random() * 30));
        
        // Due date is 14 days after borrow date
        const dueDate = new Date(borrowDate);
        dueDate.setDate(borrowDate.getDate() + 14);
        
        // 80% chance the book is returned
        const isReturned = Math.random() < 0.8;
        
        // If returned, set return date between borrow date and now
        let returnDate: Date | null = null;
        if (isReturned) {
          const daysBorrowed = Math.min(
            Math.floor((now.getTime() - borrowDate.getTime()) / (1000 * 60 * 60 * 24)),
            14 // Max 14 days
          );
          returnDate = new Date(borrowDate);
          returnDate.setDate(borrowDate.getDate() + Math.floor(Math.random() * daysBorrowed));
        }

        // Calculate fine if any (only if book is not returned and overdue)
        let fine = 0;
        if (!isReturned && now > dueDate) {
          const daysOverdue = Math.floor((now.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24));
          fine = daysOverdue * 1000; // 1000 UGX per day
        }

        try {
          // Create a new borrowed book record
          const borrowedBook = borrowedBookRepo.create({
            userId: user.id,
            bookId: book.id,
            accessNumberId: accessNumber.id,
            borrowedAt: borrowDate,
            dueDate,
            returnedAt: returnDate,
            fineAmount: fine,
            status: isReturned ? BorrowedBookStatus.RETURNED : BorrowedBookStatus.BORROWED,
            isReturned,
            user,
            book,
            accessNumber
          });
          
          // Save the borrowed book
          const savedBorrowedBook = await borrowedBookRepo.save(borrowedBook);
          borrowedBooks.push(savedBorrowedBook);
          
          // Update book available copies using direct query with proper column name
          await queryRunner.query(
            'UPDATE `books` SET `availableCopies` = `availableCopies` - 1 WHERE `id` = ?',
            [book.id]
          );
          
          // Refresh the book entity to ensure consistency
          await bookRepo.findOne({ where: { id: book.id } });
            
          console.log(`Borrowed book ${book.title} for user ${user.email}`);
        } catch (error) {
          console.error(`Error borrowing book ${book.title} for user ${user.email}:`, error);
        }
      }
    }

    console.log(`✅ Seeded ${borrowedBooks.length} borrowed books`);
    return borrowedBooks;
  }

  /**
   * Helper method to get random items from an array
   */
  private getRandomItems<T>(array: T[], min: number, max: number): T[] {
    const count = Math.floor(Math.random() * (max - min + 1)) + min;
    const shuffled = [...array].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, Math.min(count, array.length));
  }
}
