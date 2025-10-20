import { DataSource } from 'typeorm';
import { ISeeder, SeedResult } from '../base-seed.interface';
import { Book } from '../../../books/entities/book.entity';
import { Category } from '../../../sys-configs/categories/entities/category.entity';
import { Subject } from '../../../sys-configs/subjects/entities/subject.entity';
import { Type as TypeEntity } from '../../../sys-configs/types/entities/type.entity';
import { Source } from '../../../sys-configs/sources/entities/source.entity';
import { BookMetadata } from '../../../books/entities/book-metadata.entity';
import { faker } from '@faker-js/faker';
import { BookCopyStatus } from 'src/books/entities/book-copy.entity';

interface BookData {
  title: string;
  author: string;
  isbn: string;
  publisher: string;
  publicationYear: number;
  edition?: string;
  description: string;
  coverImageUrl?: string;
  totalCopies: number;
  availableCopies: number;
  ddc: string;
  ebookUrl?: string;
  price: string;
  location: string;
  shelf: string;
  categories: { id: number }[];
  subjects: { id: number }[];
  type: { id: number };
  source: { id: number };
  metadata: {
    views: number;
    averageRating: number;
    ratingCount: number;
    borrowCount: number;
    favoriteCount: number;
    lastAccessedAt: Date;
  };
  copies?: Array<{
    barcode: string;
    status: 'available' | 'on_loan' | 'lost' | 'damaged' | 'in_repair';
    acquisitionDate: Date;
    notes?: string;
  }>;
}

// Helper function to generate realistic book data
const generateBookData = (): Omit<BookData, 'categories' | 'subjects' | 'type' | 'source' | 'metadata'> & { language: string } => {
  const title = faker.lorem.words({ min: 2, max: 6 });
  const author = `${faker.person.firstName()} ${faker.person.lastName()}`;
  const isbn = faker.commerce.isbn(13);
  const publisher = faker.company.name();
  const publicationYear = faker.number.int({ min: 1950, max: new Date().getFullYear() });
  const edition = faker.helpers.arrayElement([
    undefined,
    '1st', '2nd', '3rd', '4th', '5th',
    'Revised Edition', 'Updated Edition', 'Special Edition'
  ]);
  const description = faker.lorem.paragraphs(3);
  const coverImageUrl = faker.image.urlPicsumPhotos({ width: 200, height: 300 });
  const totalCopies = faker.number.int({ min: 1, max: 5 });
  const availableCopies = faker.number.int({ min: 0, max: totalCopies });
  const ddc = `${faker.number.int({ min: 0, max: 999 })}.${faker.number.int({ min: 0, max: 99 })}`;
  const hasEbook = faker.datatype.boolean({ probability: 0.3 });
  const ebookUrl = hasEbook ? faker.internet.url() : undefined;
  const price = faker.commerce.price({ min: 5, max: 200, dec: 2 });
  const location = faker.helpers.arrayElement(['Main Library', 'Science Wing', 'Reference Section', 'Digital Collection']);
  const shelf = `${faker.helpers.arrayElement(['A', 'B', 'C', 'D'])}-${faker.number.int({ min: 1, max: 50 })}`;
  const language = faker.helpers.arrayElement(['English', 'French', 'Swahili', 'Luganda', 'Runyankole']);

  return {
    title: title.split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' '),
    author,
    isbn,
    publisher,
    publicationYear,
    edition,
    description,
    coverImageUrl,
    totalCopies,
    availableCopies,
    ddc,
    ebookUrl,
    price,
    location,
    shelf,
    language
  };
};

export class BooksSeed implements ISeeder {
  public async run(dataSource: DataSource): Promise<SeedResult> {
    console.log('Seeding books...');
    const bookRepository = dataSource.getRepository(Book);
    const categoryRepository = dataSource.getRepository(Category);
    const subjectRepository = dataSource.getRepository(Subject);
    const typeRepository = dataSource.getRepository(TypeEntity);
    const sourceRepository = dataSource.getRepository(Source);
    const metadataRepository = dataSource.getRepository(BookMetadata);

    // Get all categories, subjects, types, and sources
    const [categories, subjects, types, sources] = await Promise.all([
      categoryRepository.find(),
      subjectRepository.find(),
      typeRepository.find(),
      sourceRepository.find()
    ]);

    if (!categories.length || !subjects.length || !types.length || !sources.length) {
      console.warn('Skipping books seeding: Required data not found');
      return { entity: 'Book', count: 0 };
    }

    // Generate 50 random books
    const booksData: BookData[] = Array.from({ length: 50 }, (_, i) => {
      const bookData = generateBookData();
      const numCategories = faker.number.int({ min: 1, max: 3 });
      const numSubjects = faker.number.int({ min: 1, max: 2 });

      // Select random categories and subjects
      const selectedCategories = faker.helpers.arrayElements(categories, numCategories);
      const selectedSubjects = faker.helpers.arrayElements(subjects, numSubjects);

      // Generate book copies with proper status types
      const copies = Array.from({ length: bookData.totalCopies }, (_, i) => ({
        barcode: `BK-${faker.string.alphanumeric(8).toUpperCase()}`,
        status: (i < bookData.availableCopies
          ? 'available'
          : faker.helpers.arrayElement([
            'on_loan',
            'lost',
            'damaged',
            'in_repair'
          ])) as 'available' | 'on_loan' | 'lost' | 'damaged' | 'in_repair',
        acquisitionDate: faker.date.past({ years: 5 }),
        notes: faker.helpers.maybe(() => faker.lorem.sentence(), { probability: 0.3 })
      }))

      return {
        ...bookData,
        categories: selectedCategories.map(c => ({ id: c.id })),
        subjects: selectedSubjects.map(s => ({ id: s.id })),
        type: { id: faker.helpers.arrayElement(types).id },
        source: { id: faker.helpers.arrayElement(sources).id },
        metadata: {
          views: faker.number.int({ min: 0, max: 1000 }),
          averageRating: parseFloat(faker.number.float({ min: 1, max: 5 }).toFixed(1)),
          ratingCount: faker.number.int({ min: 0, max: 200 }),
          borrowCount: faker.number.int({ min: 0, max: 500 }),
          favoriteCount: faker.number.int({ min: 0, max: 100 }),
          lastAccessedAt: faker.date.recent()
        },
        copies
      };
    });

    // Add some well-known books
    const popularBooks: Partial<BookData>[] = [
      {
        title: 'Clean Code: A Handbook of Agile Software Craftsmanship',
        author: 'Robert C. Martin',
        isbn: '9780132350884',
        publisher: 'Prentice Hall',
        publicationYear: 2008,
        edition: '1st',
        description: 'Even bad code can function. But if code isn\'t clean, it can bring a development organization to its knee.',
        coverImageUrl: 'https://images-na.ssl-images-amazon.com/images/I/41xShlnTZTL._SX376_BO1,204,203,200_.jpg',
        totalCopies: 5,
        availableCopies: 2,
        ddc: '005.133',
        price: '49.99',
        location: 'Main Library',
        shelf: 'CS-101',
        categories: categories.filter(c =>
          ['Computer Science', 'Programming'].some(name => c.name.includes(name))
        ).slice(0, 2),
        subjects: subjects.filter(s =>
          ['Computer Science', 'Software Engineering'].some(name => s.name.includes(name))
        ).slice(0, 1),
        type: types.find(t => t.name.toLowerCase().includes('textbook')) || types[0],
        source: sources[0],
        metadata: {
          views: 1200,
          averageRating: 4.7,
          ratingCount: 245,
          borrowCount: 180,
          favoriteCount: 128,
          lastAccessedAt: new Date()
        }
      },
      // Add more popular books as needed...
    ];

    // Merge popular books with generated ones
    const allBooksData = [...popularBooks.map(b => ({
      ...b,
      // Ensure all required fields are present
      categories: b.categories || [categories[0]],
      subjects: b.subjects || [subjects[0]],
      type: b.type || types[0],
      source: b.source || sources[0],
      metadata: b.metadata || {
        views: 0,
        averageRating: 0,
        ratingCount: 0,
        borrowCount: 0,
        favoriteCount: 0,
        lastAccessedAt: new Date()
      },
      copies: Array.from({ length: b.totalCopies || 1 }, (_, i) => ({
        barcode: `BK-${faker.string.alphanumeric(8).toUpperCase()}`,
        status: i < (b.availableCopies || 0) ? 'available' : 'on_loan',
        acquisitionDate: faker.date.past({ years: 3 })
      }))
    })), ...booksData];

    let created = 0;
    const results: string[] = [];

    // Process books in batches to avoid memory issues
    const batchSize = 20;
    for (let i = 0; i < allBooksData.length; i += batchSize) {
      const batch = allBooksData.slice(i, i + batchSize);

      for (const bookData of batch) {
        try {
          // Check if book with this ISBN or title+author already exists
          const exists = await bookRepository.findOne({
            where: [
              { isbn: bookData.isbn },
              { title: bookData.title, author: bookData.author }
            ]
          });

          if (!exists) {
            // Create metadata
            const metadata = metadataRepository.create(bookData.metadata);
            await metadataRepository.save(metadata);

            // Create book copies if any
            const copies = bookData.copies?.map(copy => ({
              ...copy,
              barcode: copy.barcode || `BK-${faker.string.alphanumeric(8).toUpperCase()}`,
              status: copy.status || 'available',
              acquisitionDate: copy.acquisitionDate || new Date(),
              notes: copy.notes || undefined
            })) || [];

            // Create book
            const book = bookRepository.create({
              ...bookData,
              metadata,
              categories: bookData.categories,
              subjects: bookData.subjects,
              type: bookData.type,
              source: bookData.source,
              copies: copies as any[] // Type assertion to avoid TypeScript errors
            });

            await bookRepository.save(book);
            created++;
            results.push(`Created book: ${book.title} (${book.isbn})`);
          } else {
            results.push(`Book already exists: ${bookData.title} by ${bookData.author}`);
          }
        } catch (error) {
          results.push(`Error processing book ${bookData.title}: ${error.message}`);
        }
      }
    }

    console.log(results.join('\n'));
    return {
      entity: 'Book',
      count: created
    };
  }
}