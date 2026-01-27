import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { CreateBookDto } from '../books/dto/create-book.dto';

// Import node-isbn for ISBN resolution
const isbn = require('node-isbn');

// OCLC/WorldCat response interfaces
interface WorldCatBookData {
  title?: string;
  author?: string;
  publisher?: string;
  publicationYear?: number;
  description?: string;
  ddc?: string;
  isbn?: string;
  coverImageUrl?: string;
  edition?: string;
  language?: string;
}

@Injectable()
export class WorldCatService {
  private readonly logger = new Logger(WorldCatService.name);
  private readonly httpService: HttpService;

  constructor(httpService: HttpService) {
    this.httpService = httpService;
  }

  /**
   * Fetch book information by ISBN using node-isbn (primary method)
   * Uses callback-based API wrapped in a Promise
   */
  async fetchBookByISBN(isbnInput: string): Promise<WorldCatBookData | null> {
    return new Promise((resolve) => {
      try {
        const cleanISBN = isbnInput.replace(/[^0-9Xx]/g, '');

        if (cleanISBN.length < 10 || cleanISBN.length > 13) {
          this.logger.warn(`Invalid ISBN format: ${isbnInput}`);
          resolve(null);
          return;
        }

        this.logger.debug(`Fetching book data for ISBN: ${cleanISBN}`);

        // Use node-isbn.resolve() with callback
        isbn.resolve(cleanISBN, (err: any, book: any) => {
          if (err) {
            this.logger.debug(`node-isbn error: ${err.message}`);
            resolve(null);
            return;
          }

          if (!book) {
            this.logger.warn(`No book found for ISBN: ${cleanISBN}`);
            resolve(null);
            return;
          }

          // Parse the book data from node-isbn response
          const bookData = this.parseNodeISBNResponse(book, cleanISBN);
          this.logger.log(
            `Successfully fetched book data for ISBN: ${cleanISBN}`,
          );
          resolve(bookData);
        });
      } catch (error) {
        this.logger.error(`Error in fetchBookByISBN: ${error.message}`);
        resolve(null);
      }
    });
  }

  /**
   * Parse node-isbn response and extract book data
   * Enhanced to match the reference code's data extraction
   */
  private parseNodeISBNResponse(
    book: any,
    cleanISBN: string,
  ): WorldCatBookData {
    // this.logger.debug(`Parsing node-isbn response for ISBN: ${cleanISBN}`);
    // this.logger.debug(`Book data structure:`, JSON.stringify(book, null, 2));

    // Extract description with multiple fallbacks
    let description = '';
    if (book.description) {
      if (typeof book.description === 'string') {
        description = book.description;
      } else if (book.description.value) {
        description = book.description.value;
      } else if (
        Array.isArray(book.description) &&
        book.description.length > 0
      ) {
        description = book.description[0];
      }
    }

    // Extract cover image with multiple fallbacks
    let coverImageUrl = '';
    if (book.imageLinks?.thumbnail) {
      coverImageUrl = book.imageLinks.thumbnail;
    } else if (book.thumbnailUrl) {
      coverImageUrl = book.thumbnailUrl;
    } else if (book.thumbnail) {
      coverImageUrl = book.thumbnail;
    } else if (book.cover?.thumbnail) {
      coverImageUrl = book.cover.thumbnail;
    } else if (book.cover?.large) {
      coverImageUrl = book.cover.large;
    }

    // Extract publisher with fallbacks
    let publisher = '';
    if (book.publisher) {
      if (typeof book.publisher === 'string') {
        publisher = book.publisher;
      } else if (Array.isArray(book.publisher) && book.publisher.length > 0) {
        publisher = book.publisher[0];
      } else if (book.publisher.name) {
        publisher = book.publisher.name;
      }
    }

    // Extract authors properly
    let author = '';
    if (book.authors) {
      if (Array.isArray(book.authors)) {
        author = book.authors
          .map((a: any) => {
            if (typeof a === 'string') return a;
            if (a.name) return a.name;
            return String(a);
          })
          .join(', ');
      } else if (book.author) {
        author = book.author;
      }
    } else if (book.author) {
      author = book.author;
    }

    // Extract publication year
    let publicationYear: number | undefined;
    if (book.publishedDate) {
      const yearStr = String(book.publishedDate).split('-')[0];
      const year = parseInt(yearStr);
      if (!isNaN(year) && year > 1000 && year < 2100) {
        publicationYear = year;
      }
    } else if (book.pub_year) {
      const year = parseInt(String(book.pub_year));
      if (!isNaN(year) && year > 1000 && year < 2100) {
        publicationYear = year;
      }
    }

    const result = {
      title: book.title || '',
      author: author,
      publisher: publisher,
      publicationYear: publicationYear,
      description: description || 'NO DESCRIPTION AVAILABLE',
      isbn: cleanISBN,
      coverImageUrl:
        coverImageUrl || '/uploaded_files/book_images/No-image.jpg',
      edition: book.edition || '',
      language: book.language || 'en',
      ddc: book.ddc || '',
    };

    // this.logger.log(`Parsed book data:`, JSON.stringify(result, null, 2));
    return result;
  }

  /**
   * Fetch from OpenLibrary API (no rate limits, very reliable fallback)
   */
  async fetchBookByISBNFromOpenLibrary(
    isbn: string,
  ): Promise<WorldCatBookData | null> {
    try {
      const cleanISBN = isbn.replace(/[^0-9Xx]/g, '');

      if (cleanISBN.length < 10 || cleanISBN.length > 13) {
        this.logger.warn(`Invalid ISBN format: ${isbn}`);
        return null;
      }

      // Fetch from OpenLibrary books API
      const booksUrl = `https://openlibrary.org/api/books?bibkeys=ISBN:${cleanISBN}&jio=1&format=json`;

      const response = await this.httpService.axiosRef.get(booksUrl, {
        headers: {
          'User-Agent': 'LMS-Backend/1.0',
          Accept: 'application/json',
        },
        timeout: 10000,
      });

      if (response.status === 200 && response.data) {
        const data = response.data;
        const bookKey = Object.keys(data)[0];

        if (bookKey && data[bookKey]) {
          const book = data[bookKey];
          const bookUrl = book.info_url;

          if (bookUrl) {
            try {
              // Fetch detailed book info
              const detailResponse = await this.httpService.axiosRef.get(
                `${bookUrl}.json`,
                {
                  headers: {
                    'User-Agent': 'LMS-Backend/1.0',
                    Accept: 'application/json',
                  },
                  timeout: 10000,
                },
              );

              if (detailResponse.status === 200 && detailResponse.data) {
                const detail = detailResponse.data;
                // this.logger.debug(`OpenLibrary found detailed data for ISBN: ${cleanISBN}`);

                // Extract description with multiple fallbacks
                let description = '';
                if (detail.description) {
                  if (typeof detail.description === 'string') {
                    description = detail.description;
                  } else if (detail.description.value) {
                    description = detail.description.value;
                  } else if (
                    Array.isArray(detail.description) &&
                    detail.description.length > 0
                  ) {
                    description = detail.description[0];
                  }
                }

                // Extract cover image with OpenLibrary cover API
                let coverImageUrl = book.thumbnail_url || '';
                if (
                  !coverImageUrl &&
                  detail.covers &&
                  detail.covers.length > 0
                ) {
                  const coverId = detail.covers[0];
                  coverImageUrl = `https://covers.openlibrary.org/b/id/${coverId}-M.jpg`;
                }

                // Extract authors properly
                let author = '';
                if (detail.authors) {
                  author = detail.authors
                    .map((a: any) => a.name || a)
                    .join(', ');
                }

                // Extract publisher
                let publisher = '';
                if (detail.publishers) {
                  if (Array.isArray(detail.publishers)) {
                    publisher =
                      detail.publishers[0]?.name || detail.publishers[0] || '';
                  } else {
                    publisher = detail.publishers;
                  }
                }

                // Extract publication year
                let publicationYear: number | undefined;
                if (detail.publish_date) {
                  const yearStr = String(detail.publish_date).split('-')[0];
                  const year = parseInt(yearStr);
                  if (!isNaN(year) && year > 1000 && year < 2100) {
                    publicationYear = year;
                  }
                }

                return {
                  title: detail.title || '',
                  author: author,
                  publisher: publisher,
                  publicationYear: publicationYear,
                  description: description || 'NO DESCRIPTION AVAILABLE',
                  isbn: cleanISBN,
                  coverImageUrl:
                    coverImageUrl || '/uploaded_files/book_images/No-image.jpg',
                  edition: detail.edition || '',
                  language: detail.languages?.[0]?.key || 'en',
                  ddc: detail.dewey_decimal_class?.[0] || '',
                };
              }
            } catch (e) {
              this.logger.debug(
                `Could not fetch detailed OpenLibrary data: ${e.message}`,
              );
            }
          }

          // Return basic OpenLibrary data if detailed fetch failed
          this.logger.debug(
            `OpenLibrary found basic data for ISBN: ${cleanISBN}`,
          );
          return {
            title: book.title || '',
            author: '',
            publisher: '',
            publicationYear: undefined,
            description: 'NO DESCRIPTION AVAILABLE',
            isbn: cleanISBN,
            coverImageUrl:
              book.thumbnail_url || '/uploaded_files/book_images/No-image.jpg',
            edition: '',
            language: 'en',
            ddc: '',
          };
        }
      }

      this.logger.warn(`Book not found on OpenLibrary for ISBN: ${isbn}`);
      return null;
    } catch (error) {
      this.logger.debug(
        `Error fetching book from OpenLibrary: ${error.message}`,
      );
      return null;
    }
  }

  /**
   * Try to fetch book data using multiple sources with fallback
   * Priority: node-isbn (Google Books + OpenLibrary) → OpenLibrary
   */
  async fetchBookDataWithFallback(
    isbnInput: string,
  ): Promise<WorldCatBookData | null> {
    // Clean ISBN first
    const cleanISBN = isbnInput.replace(/[^0-9Xx]/g, '');

    if (cleanISBN.length < 10 || cleanISBN.length > 13) {
      this.logger.warn(`Invalid ISBN format: ${isbnInput}`);
      return null;
    }

    // First try node-isbn (tries multiple providers internally)
    let bookData = await this.fetchBookByISBN(cleanISBN);

    if (bookData) {
      return bookData;
    }

    // Fallback to OpenLibrary (no rate limits)
    this.logger.log(
      `node-isbn failed, trying OpenLibrary for ISBN: ${cleanISBN}`,
    );
    bookData = await this.fetchBookByISBNFromOpenLibrary(cleanISBN);

    return bookData;
  }

  /**
   * Validate ISBN checksum (ISBN-10 and ISBN-13)
   */
  validateISBN(isbn: string): boolean {
    const cleanISBN = isbn.replace(/[^0-9Xx]/g, '');

    if (cleanISBN.length === 10) {
      return this.validateISBN10(cleanISBN);
    } else if (cleanISBN.length === 13) {
      return this.validateISBN13(cleanISBN);
    }

    return false;
  }

  private validateISBN10(isbn: string): boolean {
    let sum = 0;
    for (let i = 0; i < 10; i++) {
      const digit = isbn[i].toUpperCase() === 'X' ? 10 : parseInt(isbn[i]);
      sum += digit * (10 - i);
    }
    return sum % 11 === 0;
  }

  private validateISBN13(isbn: string): boolean {
    let sum = 0;
    for (let i = 0; i < 13; i++) {
      const digit = parseInt(isbn[i]);
      sum += digit * (i % 2 === 0 ? 1 : 3);
    }
    return sum % 10 === 0;
  }

  /**
   * Populate CreateBookDto with WorldCat data
   */
  populateBookDto(bookData: WorldCatBookData): Partial<CreateBookDto> {
    const dto: Partial<CreateBookDto> = {};

    if (bookData.title) dto.title = bookData.title;
    if (bookData.author) dto.author = bookData.author;
    if (bookData.publisher) dto.publisher = bookData.publisher;
    if (bookData.publicationYear)
      dto.publicationYear = bookData.publicationYear;
    if (bookData.description) dto.description = bookData.description;
    if (bookData.ddc) dto.ddc = bookData.ddc;
    if (bookData.isbn) dto.isbn = bookData.isbn;
    if (bookData.coverImageUrl) dto.coverImageUrl = bookData.coverImageUrl;

    return dto;
  }
}
