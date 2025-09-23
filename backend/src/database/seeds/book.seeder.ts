import { DataSource, QueryRunner } from 'typeorm';
import { Book } from '../../books/entities/book.entity';
import { AccessNumber } from '../../books/entities/access-number.entity';
import { BookType, BookSource } from '../../books/enums/book-type.enum';
import { Category } from '../../books/entities/category.entity';
import { Subject } from '../../books/entities/subject.entity';

export class BookSeeder {
  constructor(private dataSource: DataSource) {}

  async seed(queryRunner: QueryRunner, categories: Category[], subjects: Subject[]) {
    // Reset auto-increment counters
    await queryRunner.query('ALTER TABLE books AUTO_INCREMENT = 1');
    await queryRunner.query('ALTER TABLE access_numbers AUTO_INCREMENT = 1');

    // Real books data with diverse categories and subjects
    const books = [
      // 1. Computer Science & Technology
      {
        title: 'Clean Code: A Handbook of Agile Software Craftsmanship',
        author: 'Robert C. Martin',
        isbn: '9780132350884',
        ddc: '005.1',
        publisher: 'Prentice Hall',
        publicationYear: 2008,
        edition: '1st',
        description: 'Even bad code can function. But if code isn\'t clean, it can bring a development organization to its knees.',
        type: BookType.PHYSICAL,
        source: BookSource.PURCHASE,
        totalCopies: 5,
        availableCopies: 3,
        pages: 464,
        language: 'English',
        coverImageUrl: 'https://m.media-amazon.com/images/I/41xShlnTZTL._SY425_.jpg',
        location: 'Main Library',
        shelf: 'CS-1-2',
        rating: 4.7,
        from: 'ISBAT Bookstore',
        categories: [categories[4]],
        subjects: [subjects[0], subjects[1]],
      },
      {
        title: 'The Pragmatic Programmer',
        author: 'Andrew Hunt, David Thomas',
        isbn: '9780135957059',
        ddc: '005.2',
        publisher: 'Addison-Wesley Professional',
        publicationYear: 2019,
        edition: '2nd',
        description: 'The Pragmatic Programmer is one of those rare tech books you\'ll read, re-read, and read again over the years.',
        type: BookType.PHYSICAL,
        source: BookSource.PURCHASE,
        totalCopies: 3,
        availableCopies: 2,
        pages: 352,
        language: 'English',
        coverImageUrl: 'https://m.media-amazon.com/images/I/51W1sBPO7tL._SY425_.jpg',
        location: 'Main Library',
        shelf: 'CS-1-3',
        rating: 4.7,
        from: 'ISBAT Bookstore',
        categories: [categories[2], categories[4]],
        subjects: [subjects[0], subjects[2]],
      },
      {
        title: 'Designing Data-Intensive Applications',
        author: 'Martin Kleppmann',
        isbn: '9781449373320',
        ddc: '005.74',
        publisher: "O'Reilly Media",
        publicationYear: 2017,
        edition: '1st',
        description: 'The Big Ideas Behind Reliable, Scalable, and Maintainable Systems',
        type: BookType.PHYSICAL,
        source: BookSource.PURCHASE,
        totalCopies: 4,
        availableCopies: 2,
        pages: 613,
        language: 'English',
        coverImageUrl: 'https://m.media-amazon.com/images/I/61u1mU3kHZL._SY425_.jpg',
        location: 'Main Library',
        shelf: 'CS-2-1',
        rating: 4.8,
        from: 'ISBAT Bookstore',
        categories: [categories[4]],
        subjects: [subjects[0], subjects[1]],
      },

      // 2. Business & Economics
      {
        title: 'Atomic Habits',
        author: 'James Clear',
        isbn: '9780735211292',
        ddc: '158.1',
        publisher: 'Avery',
        publicationYear: 2018,
        edition: '1st',
        description: 'Tiny Changes, Remarkable Results: An Easy & Proven Way to Build Good Habits & Break Bad Ones',
        type: BookType.PHYSICAL,
        source: BookSource.PURCHASE,
        totalCopies: 4,
        availableCopies: 2,
        pages: 320,
        language: 'English',
        coverImageUrl: 'https://m.media-amazon.com/images/I/51B7kuFwQFL._SY425_.jpg',
        location: 'Business Section',
        shelf: 'BS-2-1',
        rating: 4.8,
        from: 'ISBAT Bookstore',
        categories: [categories[7], categories[6]],
        subjects: [subjects[5]],
      },
      {
        title: 'Good to Great',
        author: 'Jim Collins',
        isbn: '9780066620992',
        ddc: '658',
        publisher: 'HarperBusiness',
        publicationYear: 2001,
        edition: '1st',
        description: 'Why Some Companies Make the Leap... and Others Don\'t',
        type: BookType.PHYSICAL,
        source: BookSource.PURCHASE,
        totalCopies: 3,
        availableCopies: 1,
        pages: 400,
        language: 'English',
        coverImageUrl: 'https://m.media-amazon.com/images/I/71Tijr9zJFL._SY425_.jpg',
        location: 'Business Section',
        shelf: 'BS-2-2',
        rating: 4.6,
        from: 'ISBAT Bookstore',
        categories: [categories[7]],
        subjects: [subjects[5]],
      },
      {
        title: 'The Lean Startup',
        author: 'Eric Ries',
        isbn: '9780307887894',
        ddc: '658.1',
        publisher: 'Crown Business',
        publicationYear: 2011,
        edition: '1st',
        description: 'How Today\'s Entrepreneurs Use Continuous Innovation to Create Radically Successful Businesses',
        type: BookType.PHYSICAL,
        source: BookSource.PURCHASE,
        totalCopies: 3,
        availableCopies: 2,
        pages: 336,
        language: 'English',
        coverImageUrl: 'https://m.media-amazon.com/images/I/81vvgZqCskL._SY425_.jpg',
        location: 'Business Section',
        shelf: 'BS-3-1',
        rating: 4.5,
        from: 'ISBAT Bookstore',
        categories: [categories[7]],
        subjects: [subjects[5]],
      },

      // 3. Science & Mathematics
      {
        title: 'A Brief History of Time',
        author: 'Stephen Hawking',
        isbn: '9780553380163',
        ddc: '523.1',
        publisher: 'Bantam',
        publicationYear: 1998,
        edition: '10th',
        description: 'From the Big Bang to Black Holes',
        type: BookType.PHYSICAL,
        source: BookSource.PURCHASE,
        totalCopies: 4,
        availableCopies: 3,
        pages: 212,
        language: 'English',
        coverImageUrl: 'https://m.media-amazon.com/images/I/71+1D5D15YL._SY425_.jpg',
        location: 'Science Wing',
        shelf: 'SC-1-1',
        rating: 4.7,
        from: 'ISBAT Bookstore',
        categories: [categories[2]],
        subjects: [subjects[2], subjects[1]],
      },
      {
        title: 'The Gene: An Intimate History',
        author: 'Siddhartha Mukherjee',
        isbn: '9781476733500',
        ddc: '616.04',
        publisher: 'Scribner',
        publicationYear: 2016,
        edition: '1st',
        description: 'The story of the gene begins in an obscure Augustinian abbey in Moravia in 1856',
        type: BookType.PHYSICAL,
        source: BookSource.PURCHASE,
        totalCopies: 3,
        availableCopies: 2,
        pages: 608,
        language: 'English',
        coverImageUrl: 'https://m.media-amazon.com/images/I/71+1D5D15YL._SY425_.jpg',
        location: 'Science Wing',
        shelf: 'SC-1-2',
        rating: 4.6,
        from: 'ISBAT Bookstore',
        categories: [categories[2]],
        subjects: [subjects[2]],
      },

      // 4. History & Biography
      {
        title: 'Sapiens: A Brief History of Humankind',
        author: 'Yuval Noah Harari',
        isbn: '9780062316097',
        ddc: '909',
        publisher: 'Harper',
        publicationYear: 2015,
        edition: '1st',
        description: 'From a renowned historian comes a groundbreaking narrative of humanity\'s creation and evolution',
        type: BookType.PHYSICAL,
        source: BookSource.PURCHASE,
        totalCopies: 5,
        availableCopies: 3,
        pages: 464,
        language: 'English',
        coverImageUrl: 'https://m.media-amazon.com/images/I/71-++hTVEBL._SY425_.jpg',
        location: 'History Section',
        shelf: 'HS-1-1',
        rating: 4.7,
        from: 'ISBAT Bookstore',
        categories: [categories[3], categories[1]],
        subjects: [subjects[3]],
      },
      {
        title: 'The Diary of a Young Girl',
        author: 'Anne Frank',
        isbn: '9780553296983',
        ddc: '940.53',
        publisher: 'Bantam',
        publicationYear: 1993,
        edition: 'Reissue',
        description: 'Discovered in the attic in which she spent the last years of her life',
        type: BookType.PHYSICAL,
        source: BookSource.PURCHASE,
        totalCopies: 6,
        availableCopies: 4,
        pages: 283,
        language: 'English',
        coverImageUrl: 'https://m.media-amazon.com/images/I/61I5dUi2PCL._SY425_.jpg',
        location: 'History Section',
        shelf: 'HS-2-1',
        rating: 4.8,
        from: 'ISBAT Bookstore',
        categories: [categories[3], categories[5]],
        subjects: [subjects[3]],
      },

      // 5. Literature & Fiction
      {
        title: 'To Kill a Mockingbird',
        author: 'Harper Lee',
        isbn: '9780061120084',
        ddc: '813.54',
        publisher: 'Harper Perennial Modern Classics',
        publicationYear: 2006,
        edition: '1st',
        description: 'The unforgettable novel of a childhood in a sleepy Southern town',
        type: BookType.PHYSICAL,
        source: BookSource.PURCHASE,
        totalCopies: 5,
        availableCopies: 2,
        pages: 336,
        language: 'English',
        coverImageUrl: 'https://m.media-amazon.com/images/I/71FxgtFKcQL._SY425_.jpg',
        location: 'Fiction Section',
        shelf: 'FC-1-1',
        rating: 4.8,
        from: 'ISBAT Bookstore',
        categories: [categories[0], categories[3]],
        subjects: [subjects[3]],
      },
      {
        title: '1984',
        author: 'George Orwell',
        isbn: '9780451524935',
        ddc: '823.912',
        publisher: 'Signet Classic',
        publicationYear: 1950,
        edition: 'Reissue',
        description: 'The year 1984 has come and gone, but George Orwell\'s prophetic, nightmarish vision of the world we were becoming is timelier than ever',
        type: BookType.PHYSICAL,
        source: BookSource.PURCHASE,
        totalCopies: 4,
        availableCopies: 1,
        pages: 328,
        language: 'English',
        coverImageUrl: 'https://m.media-amazon.com/images/I/61ZewDE3beL._SY425_.jpg',
        location: 'Fiction Section',
        shelf: 'FC-1-2',
        rating: 4.7,
        from: 'ISBAT Bookstore',
        categories: [categories[0]],
        subjects: [subjects[3]],
      },

      // 6. Philosophy & Psychology
      {
        title: 'Man\'s Search for Meaning',
        author: 'Viktor E. Frankl',
        isbn: '9780807014271',
        ddc: '150.19',
        publisher: 'Beacon Press',
        publicationYear: 2006,
        edition: 'Revised',
        description: 'A prominent Viennese psychiatrist before the war, Viktor Frankl was uniquely able to observe the way that both he and others in Auschwitz coped with the experience',
        type: BookType.PHYSICAL,
        source: BookSource.PURCHASE,
        totalCopies: 4,
        availableCopies: 2,
        pages: 200,
        language: 'English',
        coverImageUrl: 'https://m.media-amazon.com/images/I/71QxTRmK0FL._SY425_.jpg',
        location: 'Philosophy Section',
        shelf: 'PH-1-1',
        rating: 4.8,
        from: 'ISBAT Bookstore',
        categories: [categories[6], categories[5]],
        subjects: [subjects[4], subjects[6]],
      },
      {
        title: 'Thinking, Fast and Slow',
        author: 'Daniel Kahneman',
        isbn: '9780374533557',
        ddc: '153.4',
        publisher: 'Farrar, Straus and Giroux',
        publicationYear: 2011,
        edition: '1st',
        description: 'Major New York Times bestseller. A psychologist and Nobel Prize winner reveals the cognitive biases that shape our lives.',
        type: BookType.PHYSICAL,
        source: BookSource.PURCHASE,
        totalCopies: 3,
        availableCopies: 1,
        pages: 499,
        language: 'English',
        coverImageUrl: 'https://m.media-amazon.com/images/I/61fDrEuPJwL._SY425_.jpg',
        location: 'Psychology Section',
        shelf: 'PY-1-1',
        rating: 4.6,
        from: 'ISBAT Bookstore',
        categories: [categories[6]],
        subjects: [subjects[6]],
      },
    ];

    // Save books to database one by one to ensure proper relationship saving
    const savedBooks: Book[] = [];
    const bookRepo = this.dataSource.getRepository(Book);
    
    for (const book of books) {
      const queryRunner = this.dataSource.createQueryRunner();
      await queryRunner.connect();
      await queryRunner.startTransaction();
      
      try {
        // Create the book with relationships
        const bookEntity = bookRepo.create({
          ...book,
          categories: book.categories,
          subjects: book.subjects
        });
        
        // Save the book with relationships in a transaction
        const savedBook = await queryRunner.manager.save(bookEntity);
        
        // Commit the transaction
        await queryRunner.commitTransaction();
        
        // Reload the book with relationships to ensure they're properly loaded
        const bookWithRelations = await bookRepo.findOne({
          where: { id: savedBook.id },
          relations: ['categories', 'subjects']
        });
        
        if (bookWithRelations) {
          savedBooks.push(bookWithRelations);
          console.log(`✅ Saved book: ${savedBook.title} with ${bookWithRelations.categories?.length || 0} categories and ${bookWithRelations.subjects?.length || 0} subjects`);
        } else {
          console.warn(`⚠️  Book saved but could not be reloaded with relationships: ${savedBook.title}`);
          savedBooks.push(savedBook);
        }
      } catch (error) {
        // Rollback the transaction in case of error
        await queryRunner.rollbackTransaction();
        console.error(`❌ Error saving book ${book.title}:`, error);
      } finally {
        // Release the query runner
        await queryRunner.release();
      }
    }
    
    // Generate access numbers for each book
    const accessNumberRepo = this.dataSource.getRepository(AccessNumber);
    const accessNumbers: AccessNumber[] = [];
    
    for (const book of savedBooks) {
      // Generate unique access numbers for this book
      const accessNumbersData: Partial<AccessNumber>[] = [];
      
      for (let i = 0; i < book.totalCopies; i++) {
        // Add a small delay to ensure unique timestamps
        await new Promise(resolve => setTimeout(resolve, 10));
        
        accessNumbersData.push({
          number: `${book.id.toString().padStart(4, '0')}-${(i + 1).toString().padStart(3, '0')}`,
          bookId: book.id,
          book: book,
        });
      }
      
      // Save access numbers in batches to avoid timestamp conflicts
      const batchSize = 5;
      for (let i = 0; i < accessNumbersData.length; i += batchSize) {
        const batch = accessNumbersData.slice(i, i + batchSize);
        const savedBatch = await accessNumberRepo.save(batch);
        accessNumbers.push(...savedBatch);
      }
      
      console.log(`✅ Generated ${accessNumbersData.length} access numbers for book: ${book.title}`);
    }

    console.log(`✅ Seeded ${savedBooks.length} books with their access numbers`);
    return savedBooks;
  }
}
