import { Injectable, NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In, IsNull, Not, DataSource } from 'typeorm';
import { Book } from './entities/book.entity';
import { BookCopy, BookCopyStatus } from './entities/book-copy.entity';
import { Category } from 'src/sys-configs/categories/entities/category.entity';
import { Subject } from 'src/sys-configs/subjects/entities/subject.entity';
import { Type } from 'src/sys-configs/types/entities/type.entity';
import { Source } from 'src/sys-configs/sources/entities/source.entity';
import { BookCopiesDto, CreateBookDto } from './dto/create-book.dto';
import { UpdateBookDto } from './dto/update-book.dto';
import { BookQueryDto } from './dto/book-query.dto';
// import { BookQueryDto } from './dto/book-query.dto';

@Injectable()
export class BooksService {
  constructor(
    @InjectRepository(Book)
    private readonly bookRepository: Repository<Book>,
    @InjectRepository(BookCopy)
    private readonly bookCopyRepository: Repository<BookCopy>,
    @InjectRepository(Category)
    private readonly categoryRepository: Repository<Category>,
    @InjectRepository(Subject)
    private readonly subjectRepository: Repository<Subject>,
    @InjectRepository(Type)
    private readonly typeRepository: Repository<Type>,
    @InjectRepository(Source)
    private readonly sourceRepository: Repository<Source>,
    private dataSource: DataSource
  ) {}

  // Create a new book with copies
  async create(createBookDto: CreateBookDto): Promise<Book> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // Check for duplicate ISBN if provided
      if (createBookDto.isbn) {
        const existingBook = await this.bookRepository.findOne({
          where: { isbn: createBookDto.isbn, deletedAt: IsNull() }
        });
        if (existingBook) {
          throw new ConflictException('A book with this ISBN already exists');
        }
      }

      // Get or create categories
      const categories = await Promise.all(
        createBookDto.categories.map(categoryDto => 
          this.getOrCreateCategory(categoryDto, queryRunner)
        )
      );

      // Get or create subjects
      const subjects = await Promise.all(
        (createBookDto.subjects || []).map(subjectDto =>
          this.getOrCreateSubject(subjectDto, queryRunner)
        )
      );

      // Get type and source
      const type = await this.typeRepository.findOne({
        where: { id: createBookDto.typeId }
      });
      if (!type) {
        throw new NotFoundException(`Type with ID ${createBookDto.typeId} not found`);
      }

      let source: Source | null = null;
      if (createBookDto.sourceId) {
        source = await this.sourceRepository.findOne({
          where: { id: createBookDto.sourceId }
        });
        if (!source) {
          throw new NotFoundException(`Source with ID ${createBookDto.sourceId} not found`);
        }
      }

      // Create book entity
      const bookData = {
        ...createBookDto,
        categories,
        subjects,
        type,
        source: source || undefined, // Convert null to undefined to match the expected type
        availableCopies: 0,
        totalCopies: 0,
        // Explicitly exclude relations that might be in the DTO but shouldn't be in the entity
        copies: undefined
      };
      
      // Create and save the book in one step
      const book = this.bookRepository.create(bookData);
      const savedBook = await queryRunner.manager.save(book);

      // Create book copies if provided
      if (createBookDto.copies?.length) {
        const copies = createBookDto.copies.map(copy => ({
          accessNumber: copy.accessNumber,
          notes: copy.notes
        }));
        await this.createBookCopies(savedBook, copies, queryRunner);
      }

      await queryRunner.commitTransaction();
      // Ensure we're working with a single book
      if (Array.isArray(savedBook)) {
        if (savedBook.length === 0) {
          throw new Error('Failed to create book: No book was saved');
        }
        return this.getBookWithRelations(savedBook[0].id);
      }
      return this.getBookWithRelations(savedBook.id);
    } catch (error) {
      await queryRunner.rollbackTransaction();
      if (error instanceof ConflictException || error instanceof NotFoundException) {
        throw error;
      }
      throw new BadRequestException('Failed to create book: ' + error.message);
    } finally {
      await queryRunner.release();
    }
  }

  // Find all books with pagination and filtering
  async findAll(query: BookQueryDto) {
    const {
      search,
      page = 1,
      limit = 10,
      minAvailable,
      sortBy = 'title',
      sortOrder = 'ASC',
      ...filters
    } = query;

    const skip = (page - 1) * limit;
    const queryBuilder = this.bookRepository
      .createQueryBuilder('book')
      .leftJoinAndSelect('book.categories', 'categories')
      .leftJoinAndSelect('book.subjects', 'subjects')
      .leftJoinAndSelect('book.copies', 'copies')
      .leftJoinAndSelect('book.type', 'type')
      .leftJoinAndSelect('book.source', 'source')
      .leftJoinAndSelect('book.metadata', 'metadata')
      .where('book.deletedAt IS NULL');

    // Apply search
    if (search) {
      queryBuilder.andWhere(
        '(book.title ILIKE :search OR book.author ILIKE :search OR book.isbn = :isbn)',
        { search: `%${search}%`, isbn: search }
      );
    }

    // Apply minAvailable filter
    if (minAvailable !== undefined) {
      queryBuilder.andWhere('book.availableCopies >= :minAvailable', { minAvailable });
    }

    // Apply other filters
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && key !== 'sortBy' && key !== 'sortOrder') {
        queryBuilder.andWhere(`book.${key} = :${key}`, { [key]: value });
      }
    });

    // Apply sorting
    queryBuilder.orderBy(
      `book.${sortBy}`,
      sortOrder.toUpperCase() as 'ASC' | 'DESC'
    );

    // Get paginated results
    const [data, total] = await queryBuilder
      .skip(skip)
      .take(limit)
      .getManyAndCount();

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    };
  }

  // Find a book by ID with relations
  async findOne(id: number): Promise<Book> {
    const book = await this.bookRepository.findOne({
      where: { id, deletedAt: IsNull() },
      relations: ['categories', 'subjects', 'copies', 'type', 'source']
    });

    if (!book) {
      throw new NotFoundException(`Book with ID ${id} not found`);
    }

    return book;
  }

  // Update a book
  async update(id: number, updateBookDto: UpdateBookDto): Promise<Book> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const book = await this.bookRepository.findOne({
        where: { id, deletedAt: IsNull() },
        relations: ['categories', 'subjects']
      });

      if (!book) {
        throw new NotFoundException(`Book with ID ${id} not found`);
      }

      // Update categories if provided
      if (updateBookDto.categories) {
        book.categories = await Promise.all(
          updateBookDto.categories.map(cat => 
            this.getOrCreateCategory(cat, queryRunner)
          )
        );
      }

      // Update subjects if provided
      if (updateBookDto.subjects) {
        book.subjects = await Promise.all(
          updateBookDto.subjects.map(sub => 
            this.getOrCreateSubject(sub, queryRunner)
          )
        );
      }

      // Update other fields
      const { categories, subjects, copies, ...bookData } = updateBookDto;
      Object.assign(book, bookData);

      // Update copies if provided
      if (copies) {
        const copiesData = copies.map(copy => ({
          ...copy,
          accessNumber: copy.accessNumber || '' // Ensure accessNumber is not undefined
        }));
        await this.updateBookCopies(book, copiesData, queryRunner);
      }

      const updatedBook = await queryRunner.manager.save(book);
      await queryRunner.commitTransaction();
      return this.getBookWithRelations(updatedBook.id);
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  // Soft delete a book
  async remove(id: number): Promise<void> {
    const book = await this.bookRepository.findOne({
      where: { id, deletedAt: IsNull() },
      relations: ['copies']
    });

    if (!book) {
      throw new NotFoundException(`Book with ID ${id} not found`);
    }

    // Check for borrowed copies
    const borrowedCopies = book.copies?.filter(
      copy => copy.status === BookCopyStatus.BORROWED
    ) || [];

    if (borrowedCopies.length > 0) {
      throw new BadRequestException(
        `Cannot delete book with ID ${id} as it has ${borrowedCopies.length} borrowed copies`
      );
    }

    // Soft delete the book and its copies
    await this.bookRepository.softRemove(book);
  }

  // Helper method to get or create a category
  private async getOrCreateCategory(
    categoryDto: { name: string },
    queryRunner: any
  ): Promise<Category> {
    let category = await this.categoryRepository.findOne({
      where: { name: categoryDto.name }
    });

    if (!category) {
      category = this.categoryRepository.create(categoryDto);
      await queryRunner.manager.save(category);
    }

    return category;
  }

  // Helper method to get or create a subject
  private async getOrCreateSubject(
    subjectDto: { name: string },
    queryRunner: any
  ): Promise<Subject> {
    let subject = await this.subjectRepository.findOne({
      where: { name: subjectDto.name }
    });

    if (!subject) {
      subject = this.subjectRepository.create(subjectDto);
      await queryRunner.manager.save(subject);
    }

    return subject;
  }

  // Helper method to create book copies
  private async createBookCopies(
    book: Book,
    copies: Array<{ accessNumber: string; notes?: string }>,
    queryRunner: any
  ): Promise<void> {
    const bookCopies = copies.map(copy =>
      this.bookCopyRepository.create({
        ...copy,
        book,
        status: BookCopyStatus.AVAILABLE
      })
    );

    const savedCopies = await queryRunner.manager.save(bookCopies);
    
    // Update book counts
    book.totalCopies = (book.totalCopies || 0) + savedCopies.length;
    book.availableCopies = (book.availableCopies || 0) + savedCopies.length;
    
    await queryRunner.manager.save(book);
  }

  // Helper method to update book copies
  private async updateBookCopies(
    book: Book,
    copies: Array<{ id?: number; accessNumber: string; notes?: string }>,
    queryRunner: any
  ): Promise<void> {
    const existingCopies = await this.bookCopyRepository.find({
      where: { book: { id: book.id } }
    });

    // Update existing copies
    const updatedCopies: BookCopy[] = [];
    for (const copyDto of copies) {
      if ('id' in copyDto && copyDto.id) {
        const existingCopy = existingCopies.find(c => c.id === copyDto.id);
        if (existingCopy) {
          Object.assign(existingCopy, {
            accessNumber: copyDto.accessNumber,
            notes: copyDto.notes
          });
          const updatedCopy = await queryRunner.manager.save(BookCopy, existingCopy);
          updatedCopies.push(updatedCopy);
        }
      } else {
        // Create new copy
        const newCopy = this.bookCopyRepository.create({
          accessNumber: copyDto.accessNumber,
          notes: copyDto.notes,
          book,
          status: BookCopyStatus.AVAILABLE
        });
        const savedCopy = await queryRunner.manager.save(BookCopy, newCopy);
        updatedCopies.push(savedCopy);
      }
    }

    // Delete copies not in the updated list
    const updatedCopyIds = copies
      .map(c => 'id' in c ? c.id : null)
      .filter((id): id is number => id !== null);

    const copiesToDelete = existingCopies.filter(
      copy => !updatedCopyIds.includes(copy.id)
    );

    if (copiesToDelete.length > 0) {
      await queryRunner.manager.softRemove(copiesToDelete);
    }

    // Update book counts
    const availableCount = updatedCopies.filter(
      (copy: BookCopy) => copy.status === BookCopyStatus.AVAILABLE
    ).length;

    book.totalCopies = updatedCopies.length;
    book.availableCopies = availableCount;
    await queryRunner.manager.save(book);
  }

  async getBookDetails(id: number) {
    const book = await this.bookRepository.findOne({
      where: { id, deletedAt: IsNull() },
      relations: ['copies', 'categories', 'subjects', 'type', 'source', 'metadata']
    });

    if (!book) {
      throw new NotFoundException(`Book with ID ${id} not found`);
    }

    // Get current borrow status
    const currentBorrows = await this.bookCopyRepository
      .createQueryBuilder('copy')
      .leftJoinAndSelect('copy.loans', 'loan', 'loan.status = :status', { status: 'ACTIVE' })
      .leftJoinAndSelect('loan.user', 'user')
      .where('copy.bookId = :bookId', { bookId: id })
      .andWhere('loan.id IS NOT NULL')
      .getMany();

    // Get borrow history (last 10 returns)
    const borrowHistory = await this.bookCopyRepository
      .createQueryBuilder('copy')
      .leftJoinAndSelect('copy.loans', 'loan', 'loan.status = :status', { status: 'RETURNED' })
      .leftJoinAndSelect('loan.user', 'user')
      .where('copy.bookId = :bookId', { bookId: id })
      .andWhere('loan.id IS NOT NULL')
      .orderBy('loan.returnedAt', 'DESC').getMany();

    // Get queue requests
    const queueRequests = await this.bookRepository
      .createQueryBuilder('book')
      .leftJoinAndSelect('book.queueEntries', 'queue', 'queue.status = :queueStatus', { queueStatus: 'WAITING' })
      .leftJoinAndSelect('queue.user', 'user')
      .where('book.id = :bookId', { bookId: id })
      .orderBy('queue.position', 'ASC')
      .getOne();

    // Format current borrows
    const currentBorrowsFormatted = currentBorrows.flatMap(copy =>
      copy.loans?.map(loan => ({
        copy_id: copy.id,
        copy_access_number: copy.accessNumber,
        borrower: {
          user_id: loan.user.id,
          name: `${loan.user.firstName} ${loan.user.lastName}`.trim(),
          roll_number: loan.user.rollNumber,
          email: loan.user.email,
          phone: loan.user.phoneNumber
        },
        borrowed_at: loan.borrowedAt,
        due_date: loan.dueDate,
        is_overdue: loan.dueDate < new Date()
      })) || []
    );

    // Format borrow history
    const borrowHistoryFormatted = borrowHistory.flatMap(copy =>
      copy.loans?.map(loan => ({
        copy_id: copy.id,
        copy_access_number: copy.accessNumber,
        borrower: {
          user_id: loan.user.id,
          name: `${loan.user.firstName} ${loan.user.lastName}`.trim(),
          roll_number: loan.user.rollNumber,
          email: loan.user.email,
          phone: loan.user.phoneNumber
        },
        borrowed_at: loan.borrowedAt,
        returned_at: loan.returnedAt
      })) || []
    );

    // Format queue requests
    const queueRequestsFormatted = queueRequests?.queueEntries?.map((entry, index) => ({
      position: index + 1,
      user_id: entry.user.id,
      name: `${entry.user.firstName} ${entry.user.lastName}`.trim(),
      roll_number: entry.user.rollNumber,
      email: entry.user.email,
      phone: entry.user.phoneNumber,
      requested_at: entry.createdAt
    })) || [];

    return {
      book,
      current_borrows: currentBorrowsFormatted,
      borrow_history: borrowHistoryFormatted,
      queue_requests: queueRequestsFormatted
    };
  }

  // Helper method to get book with relations
  private async getBookWithRelations(id: number): Promise<Book> {
    const book = await this.bookRepository.findOne({
      where: { id },
      relations: [
        'categories',
        'subjects',
        'copies',
        'type',
        'source'
      ]
    });

    if (!book) {
      throw new NotFoundException(`Book with ID ${id} not found`);
    }

    return book;
  }
}
