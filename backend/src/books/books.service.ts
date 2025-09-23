import { 
  Injectable, 
  NotFoundException, 
  ConflictException, 
  BadRequestException,
  Inject,
  forwardRef
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like, Between, Not, IsNull, In } from 'typeorm';
import { Book } from './entities/book.entity';
import { Category } from './entities/category.entity';
import { Subject } from './entities/subject.entity';
import { AccessNumber } from './entities/access-number.entity';
import { CreateBookDto } from './dto/create-book.dto';
import { UpdateBookDto } from './dto/update-book.dto';
import { BookQueryDto } from './dto/book-query.dto';
import { BatchCreateBooksDto, BatchUpdateBooksDto } from './dto/batch-book.dto';

@Injectable()
export class BooksService {
  private readonly bookSelection = {
    id: true,
    title: true,
    isbn: true,
    ddc: true,
    author: true,
    publisher: true,
    publicationYear: true,
    edition: true,
    totalCopies: true,
    availableCopies: true,
    location: true,
    description: true,
    type: true,
    source: true,
    from: true,
    rating: true,
    coverImageUrl: true,
    ebookUrl: true,
    createdAt: true,
    updatedAt: true,
    categories: { id: true, name: true, description: true },
    subjects: { id: true, name: true, description: true },
    accessNumbers: { id: true, number: true }
  };

  constructor(
    @InjectRepository(Book)
    private readonly bookRepository: Repository<Book>,
    @InjectRepository(Category)
    private readonly categoryRepository: Repository<Category>,
    @InjectRepository(Subject)
    private readonly subjectRepository: Repository<Subject>,
    @InjectRepository(AccessNumber)
    private readonly accessNumberRepository: Repository<AccessNumber>,
  ) {}

  async create(createBookDto: CreateBookDto): Promise<Book> {
    // Check if ISBN already exists
    if (createBookDto.isbn) {
      const existingBook = await this.bookRepository.findOne({ 
        where: { isbn: createBookDto.isbn, deletedAt: IsNull() } 
      });
      
      if (existingBook) {
        throw new ConflictException('A book with this ISBN already exists');
      }
    }

    // Process categories - create or find existing
    const categories = await Promise.all(
      createBookDto.categories.map(categoryDto => 
        this.categoryRepository.findOne({ where: { name: categoryDto.name } })
          .then(existing => existing || this.categoryRepository.create(categoryDto))
      )
    );

    // Process subjects - create or find existing
    const subjects = await Promise.all(
      (createBookDto.subjects || []).map(subjectDto => 
        this.subjectRepository.findOne({ where: { name: subjectDto.name } })
          .then(existing => existing || this.subjectRepository.create(subjectDto))
      )
    );

    // Create access numbers
    const accessNumbers = (createBookDto.accessNumbers || []).map(accessNumberDto => 
      this.accessNumberRepository.create(accessNumberDto)
    );

    const book = this.bookRepository.create({
      ...createBookDto,
      availableCopies: createBookDto.totalCopies,
      categories,
      subjects,
      accessNumbers,
    });

    return this.bookRepository.save(book);
  }

  async createMany(batchCreateBooksDto: BatchCreateBooksDto): Promise<Book[]> {
    const { books } = batchCreateBooksDto;
    
    // Process all books in parallel
    const createdBooks = await Promise.all(
      books.map(async (bookDto) => {
        // Check for duplicate ISBN in the batch
        const isDuplicateInBatch = books.some(
          (b, index) => b.isbn && b.isbn === bookDto.isbn && books.indexOf(bookDto) !== index
        );
        
        if (isDuplicateInBatch) {
          throw new ConflictException(`Duplicate ISBN found in batch: ${bookDto.isbn}`);
        }

        // Check if ISBN already exists in the database
        if (bookDto.isbn) {
          const existingBook = await this.bookRepository.findOne({
            where: { isbn: bookDto.isbn, deletedAt: IsNull() }
          });
          
          if (existingBook) {
            throw new ConflictException(`A book with ISBN ${bookDto.isbn} already exists`);
          }
        }

        // Process categories
        const categories = await Promise.all(
          bookDto.categories.map(categoryDto => 
            this.categoryRepository.findOne({ where: { name: categoryDto.name } })
              .then(existing => existing || this.categoryRepository.create(categoryDto))
          )
        );

        // Process subjects
        const subjects = await Promise.all(
          (bookDto.subjects || []).map(subjectDto => 
            this.subjectRepository.findOne({ where: { name: subjectDto.name } })
              .then(existing => existing || this.subjectRepository.create(subjectDto))
          )
        );

        // Create access numbers
        const accessNumbers = (bookDto.accessNumbers || []).map(accessNumberDto => 
          this.accessNumberRepository.create(accessNumberDto)
        );

        // Create book
        const book = this.bookRepository.create({
          ...bookDto,
          availableCopies: bookDto.totalCopies,
          categories,
          subjects,
          accessNumbers,
        });

        return book;
      })
    );

    // Save all books in a transaction
    return this.bookRepository.save(createdBooks);
  }

  async findAll(query: BookQueryDto): Promise<{ data: Book[]; total: number }> {
    const { 
      search, 
      author, 
      title, 
      isbn, 
      minYear, 
      maxYear, 
      categories, 
      type, 
      minAvailable = 1,
      page = 1, 
      limit = 10, 
      sortBy = 'title', 
      sortOrder = 'ASC' 
    } = query;

    const skip = (page - 1) * limit;
    const queryBuilder = this.bookRepository
      .createQueryBuilder('book')
      .leftJoinAndSelect('book.categories', 'categories')
      .leftJoinAndSelect('book.subjects', 'subjects')
      .leftJoinAndSelect('book.accessNumbers', 'accessNumbers')
      .select([
        'book.id', 'book.title', 'book.isbn', 'book.author', 'book.publisher',
        'book.publicationYear', 'book.edition', 'book.totalCopies', 'book.availableCopies',
        'book.description', 'book.coverImageUrl', 'book.ebookUrl', 'book.rating',
        'book.createdAt', 'book.updatedAt',
        'categories.id', 'categories.name',
        'subjects.id', 'subjects.name',
        'accessNumbers.id', 'accessNumbers.number'
      ])
      .where('book.deletedAt IS NULL');

    // Apply filters
    if (search) {
      queryBuilder.andWhere('(book.title LIKE :search OR book.author LIKE :search)', { 
        search: `%${search}%` 
      });
    }
    
    if (author) {
      queryBuilder.andWhere('book.author LIKE :author', { author: `%${author}%` });
    }
    
    if (title) {
      queryBuilder.andWhere('book.title LIKE :title', { title: `%${title}%` });
    }
    
    if (isbn) {
      queryBuilder.andWhere('book.isbn = :isbn', { isbn });
    }
    
    if (minYear !== undefined && maxYear !== undefined) {
      queryBuilder.andWhere('book.publicationYear BETWEEN :minYear AND :maxYear', { 
        minYear, 
        maxYear 
      });
    } else if (minYear !== undefined) {
      queryBuilder.andWhere('book.publicationYear >= :minYear', { minYear });
    } else if (maxYear !== undefined) {
      queryBuilder.andWhere('book.publicationYear <= :maxYear', { maxYear });
    }
    
    if (categories && categories.length > 0) {
      queryBuilder.andWhere('category.id IN (:...categoryIds)', { 
        categoryIds: categories 
      });
    }
    
    if (type) {
      queryBuilder.andWhere('book.type = :type', { type });
    }
    
    // queryBuilder.andWhere('book.availableCopies >= :minAvailable', { minAvailable });

    // Apply sorting
    const order: any = {};
    order[`book.${sortBy}`] = sortOrder;
    queryBuilder.orderBy(order);

    // Apply pagination
    queryBuilder.skip(skip).take(limit);

    // Get results
    const [data, total] = await queryBuilder.getManyAndCount();

    return { data, total };
  }

  async findOne(id: number): Promise<Book> {
    const book = await this.bookRepository.findOne({
      where: { id, deletedAt: IsNull() },
      relations: ['categories', 'subjects', 'accessNumbers'],
      select: this.bookSelection as any
    });

    if (!book) {
      throw new NotFoundException(`Book with ID ${id} not found`);
    }
    return book;
  }

  async update(id: number, updateBookDto: UpdateBookDto): Promise<Book> {
    const book = await this.bookRepository.findOne({ 
      where: { id, deletedAt: IsNull() },
      relations: ['categories', 'subjects', 'accessNumbers']
    });

    if (!book) {
      throw new NotFoundException(`Book with ID ${id} not found`);
    }

    // Check if ISBN is being updated and if it already exists
    if (updateBookDto.isbn && updateBookDto.isbn !== book.isbn) {
      const existingBook = await this.bookRepository.findOne({ 
        where: { isbn: updateBookDto.isbn, deletedAt: IsNull() } 
      });
      
      if (existingBook) {
        throw new ConflictException('A book with this ISBN already exists');
      }
    }

    // Update categories if provided
    if (updateBookDto.categories) {
      book.categories = await Promise.all(
        updateBookDto.categories.map(categoryDto => 
          this.categoryRepository.findOne({ where: { name: categoryDto.name } })
            .then(existing => existing || this.categoryRepository.create(categoryDto))
        )
      );
    }

    // Update subjects if provided
    if (updateBookDto.subjects) {
      book.subjects = await Promise.all(
        (updateBookDto.subjects || []).map(subjectDto => 
          this.subjectRepository.findOne({ where: { name: subjectDto.name } })
            .then(existing => existing || this.subjectRepository.create(subjectDto))
        )
      );
    }

    // Update access numbers if provided
    if (updateBookDto.accessNumbers) {
      // Remove existing access numbers
      await this.accessNumberRepository.delete({ book: { id: book.id } });
      
      // Create new access numbers
      book.accessNumbers = updateBookDto.accessNumbers.map(accessNumberDto => 
        this.accessNumberRepository.create({
          ...accessNumberDto,
          book: { id: book.id }
        })
      );
    }

    // Update book properties
    Object.assign(book, updateBookDto);

    // Update available copies if total copies changed
    if (updateBookDto.totalCopies !== undefined) {
      const difference = updateBookDto.totalCopies - book.totalCopies;
      book.availableCopies = Math.max(0, book.availableCopies + difference);
      book.totalCopies = updateBookDto.totalCopies;
    }

    return this.bookRepository.save(book);
  }

  async updateMany(batchUpdateBooksDto: BatchUpdateBooksDto): Promise<Book[]> {
    const { updates } = batchUpdateBooksDto;
    
    // Process all updates in parallel
    const updatePromises = updates.map(async ({ id, data: updateData }) => {
      const book = await this.bookRepository.findOne({ 
        where: { id, deletedAt: IsNull() },
        relations: ['categories', 'subjects', 'accessNumbers']
      });

      if (!book) {
        throw new NotFoundException(`Book with ID ${id} not found`);
      }

      // Check if ISBN is being updated and if it already exists
      if (updateData.isbn && updateData.isbn !== book.isbn) {
        const existingBook = await this.bookRepository.findOne({ 
          where: { 
            isbn: updateData.isbn, 
            id: Not(id), // Exclude current book from the check
            deletedAt: IsNull() 
          } 
        });
        
        if (existingBook) {
          throw new ConflictException(`A book with ISBN ${updateData.isbn} already exists`);
        }
      }

      // Update categories if provided
      if (updateData.categories) {
        book.categories = await Promise.all(
          updateData.categories.map(categoryDto => 
            this.categoryRepository.findOne({ where: { name: categoryDto.name } })
              .then(existing => existing || this.categoryRepository.create(categoryDto))
          )
        );
      }

      // Update subjects if provided
      if (updateData.subjects) {
        book.subjects = await Promise.all(
          updateData.subjects.map(subjectDto => 
            this.subjectRepository.findOne({ where: { name: subjectDto.name } })
              .then(existing => existing || this.subjectRepository.create(subjectDto))
          )
        );
      }

      // Update access numbers if provided
      if (updateData.accessNumbers) {
        // Remove existing access numbers
        await this.accessNumberRepository.delete({ book: { id: book.id } });
        
        // Create new access numbers
        book.accessNumbers = updateData.accessNumbers.map(accessNumberDto => 
          this.accessNumberRepository.create({
            ...accessNumberDto,
            book: { id: book.id }
          })
        );
      }
      

      // Update book properties
      Object.assign(book, updateData);

      // Update available copies if total copies changed
      if (updateData.totalCopies !== undefined) {
        if (updateData.totalCopies < 0) {
          throw new BadRequestException('Total copies cannot be negative');
        }
        
        // If reducing total copies, ensure we don't go below checked out copies
        const checkedOutCopies = book.totalCopies - book.availableCopies;
        if (updateData.totalCopies < checkedOutCopies) {
          throw new BadRequestException(
            `Cannot reduce total copies below ${checkedOutCopies} (currently checked out copies)`
          );
        }
        
        // Update available copies to maintain the difference
        book.availableCopies = updateData.totalCopies - checkedOutCopies;
        book.totalCopies = updateData.totalCopies;
      }

      return book;
    });

    // Execute all updates and return the results
    const updatedBooks = await Promise.all(updatePromises);
    return this.bookRepository.save(updatedBooks);
  }

  async remove(id: number): Promise<void> {
    const book = await this.bookRepository.findOne({
      where: { id },
      relations: ['accessNumbers']
    });

    if (!book) {
      throw new NotFoundException(`Book with ID ${id} not found`);
    }

    // Remove associated access numbers
    if (book.accessNumbers && book.accessNumbers.length > 0) {
      await this.accessNumberRepository.remove(book.accessNumbers);
    }

    // Soft delete the book
    await this.bookRepository.softRemove(book);
  }

  // async checkOutBook(id: number, quantity: number = 1): Promise<Book> {
  //   if (quantity <= 0) {
  //     throw new BadRequestException('Quantity must be greater than 0');
  //   }

  //   const book = await this.bookRepository.findOne({
  //     where: { id, deletedAt: IsNull() },
  //     lock: { mode: 'pessimistic_write' } // Lock the row for update
  //   });

  //   if (!book) {
  //     throw new NotFoundException(`Book with ID ${id} not found`);
  //   }
    
  //   if (book.availableCopies < quantity) {
  //     throw new BadRequestException(
  //       `Not enough copies available. Available: ${book.availableCopies}, Requested: ${quantity}`
  //     );
  //   }

  //   book.availableCopies -= quantity;
  //   return this.bookRepository.save(book);
  // }

  // async returnBook(id: number, quantity: number = 1): Promise<Book> {
  //   if (quantity <= 0) {
  //     throw new BadRequestException('Quantity must be greater than 0');
  //   }

  //   const book = await this.bookRepository.findOne({
  //     where: { id, deletedAt: IsNull() },
  //     lock: { mode: 'pessimistic_write' } // Lock the row for update
  //   });

  //   if (!book) {
  //     throw new NotFoundException(`Book with ID ${id} not found`);
  //   }
    
  //   if (book.availableCopies + quantity > book.totalCopies) {
  //     throw new BadRequestException(
  //       `Cannot return more copies than were checked out. Current available: ${book.availableCopies}, Total: ${book.totalCopies}`
  //     );
  //   }

  //   book.availableCopies += quantity;
  //   return this.bookRepository.save(book);
  // }
}
