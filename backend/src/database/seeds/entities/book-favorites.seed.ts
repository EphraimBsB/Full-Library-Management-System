import { DataSource } from 'typeorm';
import { ISeeder, SeedResult } from '../base-seed.interface';
import { BookFavorite } from 'src/books/entities/book-favorite.entity';
import { Book } from 'src/books/entities/book.entity';
import { User } from 'src/users/entities/user.entity';
import { faker } from '@faker-js/faker';

export class BookFavoritesSeed implements ISeeder {
  public async run(dataSource: DataSource): Promise<SeedResult> {
    console.log('Seeding book favorites...');
    
    const bookFavoriteRepository = dataSource.getRepository(BookFavorite);
    const bookRepository = dataSource.getRepository(Book);
    const userRepository = dataSource.getRepository(User);

    // Get all books and users
    const books = await bookRepository.find({ take: 100 });
    const users = await userRepository.find({ take: 30 });

    if (books.length === 0 || users.length === 0) {
      console.warn('Not enough books or users found to create favorites. Skipping...');
      return { entity: 'BookFavorites', count: 0 };
    }

    const favorites: Partial<BookFavorite>[] = [];
    const maxFavoritesPerUser = 10;

    // Generate favorites for each user
    for (const user of users) {
      // Each user will have between 1 and maxFavoritesPerUser favorite books
      const userFavorites = faker.helpers.arrayElements(
        books,
        faker.number.int({ min: 1, max: maxFavoritesPerUser })
      );

      for (const book of userFavorites) {
        favorites.push({
          userId: user.id,
          bookId: book.id,
          createdAt: faker.date.past({ years: 1 })
        });
      }
    }

    try {
      // Remove duplicates (same user can't favorite the same book twice)
      const uniqueFavorites = Array.from(
        new Map(favorites.map(fav => [`${fav.userId}-${fav.bookId}`, fav])).values()
      );

      await bookFavoriteRepository.save(uniqueFavorites);
      console.log(`Successfully seeded ${uniqueFavorites.length} book favorites`);
      
      // Update favorite counts in book metadata
      await this.updateFavoriteCounts(dataSource, books);
      
      return { entity: 'BookFavorites', count: uniqueFavorites.length };
    } catch (error) {
      console.error('Error seeding book favorites:', error);
      return { entity: 'BookFavorites', count: 0, error };
    }
  }

  private async updateFavoriteCounts(dataSource: DataSource, books: Book[]): Promise<void> {
    const bookRepository = dataSource.getRepository(Book);
    
    for (const book of books) {
      // Load the book with metadata relation
      const bookWithMeta = await bookRepository.findOne({
        where: { id: book.id },
        relations: ['metadata']
      });
      
      if (bookWithMeta && bookWithMeta.metadata) {
        // Count favorites for this book
        const favoriteCount = await dataSource.getRepository(BookFavorite).count({
          where: { bookId: book.id }
        });
        
        // Update the favorite count in metadata
        bookWithMeta.metadata.favoriteCount = favoriteCount;
        await bookRepository.manager.save(bookWithMeta.metadata);
      }
    }
  }
}
