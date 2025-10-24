import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BookFavorite } from '../entities/book-favorite.entity';
import { Book } from '../entities/book.entity';
import { ToggleBookFavoriteDto } from '../dto/book-favorite.dto';

@Injectable()
export class BookFavoriteService {
  constructor(
    @InjectRepository(BookFavorite)
    private readonly bookFavoriteRepository: Repository<BookFavorite>,
    @InjectRepository(Book)
    private readonly bookRepository: Repository<Book>,
  ) {}

  async toggleFavorite(userId: string, dto: ToggleBookFavoriteDto): Promise<{ isFavorite: boolean }> {
    const { bookId } = dto;

    // Check if book exists
    const book = await this.bookRepository.findOne({ where: { id: bookId } });
    if (!book) {
      throw new NotFoundException(`Book with ID ${bookId} not found`);
    }

    // Check if favorite already exists
    const existingFavorite = await this.bookFavoriteRepository.findOne({
      where: { userId, bookId },
      withDeleted: true, // Include soft-deleted records
    });

    if (existingFavorite) {
      if (existingFavorite.deletedAt) {
        // Restore the soft-deleted favorite
        await this.bookFavoriteRepository.restore(existingFavorite.id);
        await this.updateBookFavoritesCount(bookId);
        return { isFavorite: true };
      } else {
        // Soft delete the existing favorite
        await this.bookFavoriteRepository.softDelete(existingFavorite.id);
        await this.updateBookFavoritesCount(bookId);
        return { isFavorite: false };
      }
    } else {
      // Create new favorite
      const favorite = this.bookFavoriteRepository.create({
        userId,
        bookId,
      });
      await this.bookFavoriteRepository.save(favorite);
      await this.updateBookFavoritesCount(bookId);
      return { isFavorite: true };
    }
  }

  async getUserFavorites(userId: string): Promise<Book[]> {
    const favorites = await this.bookFavoriteRepository.find({
      where: { userId },
      relations: ['book', 'book.copies'],
      order: { createdAt: 'DESC' },
    });

    return favorites.map(
      (favorite) => favorite.book,
    );
  }

  async isBookFavorite(userId: string, bookId: number): Promise<boolean> {
    const count = await this.bookFavoriteRepository.count({
      where: { userId, bookId },
      withDeleted: false,
    });
    return count > 0;
  }

  async getFavoritesCount(bookId: number): Promise<number> {
    return this.bookFavoriteRepository.count({
      where: { bookId },
      withDeleted: false,
    });
  }

  async getUserFavoritesCount(userId: string): Promise<number> {
    return this.bookFavoriteRepository.count({
      where: { userId },
      withDeleted: false,
    });
  }

  private async updateBookFavoritesCount(bookId: number): Promise<void> {
    const count = await this.getFavoritesCount(bookId);
    
    // Update the favorites count in the book's metadata
    await this.bookRepository.manager.transaction(async (transactionalEntityManager) => {
      const book = await transactionalEntityManager.findOne(Book, {
        where: { id: bookId },
        relations: ['metadata'],
      });
      
      if (book && book.metadata) {
        book.metadata.favoriteCount = count;
        await transactionalEntityManager.save(book.metadata);
      }
    });
  }

  async getPopularBooks(limit: number = 10): Promise<{ 
    book: { 
      id: number; 
      title: string; 
      author: string; 
      coverImageUrl?: string; 
    }; 
    favoritesCount: number; 
  }[]> {
    const popularBooks = await this.bookRepository
      .createQueryBuilder('book')
      .select(['book.id', 'book.title', 'book.author', 'book.coverImageUrl'])
      .addSelect('COUNT(favorites.id)', 'favoritesCount')
      .leftJoin('book.favorites', 'favorites')
      .groupBy('book.id')
      .orderBy('favoritesCount', 'DESC')
      .addOrderBy('book.title', 'ASC')
      .limit(limit)
      .getRawMany();

    return popularBooks.map((item) => ({
      book: {
        id: item.book_id,
        title: item.book_title,
        author: item.book_author,
        coverImageUrl: item.book_coverImageUrl,
      },
      favoritesCount: parseInt(item.favoritesCount, 10),
    }));
  }
}
