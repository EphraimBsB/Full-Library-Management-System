import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Book } from '../books/entities/book.entity';
import { Category } from '../books/entities/category.entity';
import { Subject } from '../books/entities/subject.entity';
import { AccessNumber } from '../books/entities/access-number.entity';
import { BookType, BookSource } from '../books/enums/book-type.enum';

@Injectable()
export class SeedService {
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

  async seed() {
    console.log('Clearing database...');
    await this.clearDatabase();
    console.log('Seeding categories...');
    const categories = await this.seedCategories();
    console.log(`Seeded ${categories.length} categories`);
    console.log('Seeding subjects...');
    const subjects = await this.seedSubjects();
    console.log(`Seeded ${subjects.length} subjects`);
    console.log('Seeding books...');
    await this.seedBooks(categories, subjects);
    console.log('Database seeded successfully!');
  }

  private async clearDatabase() {
    console.log('Deleting existing access numbers...');
    const accessNumbersDeleted = await this.accessNumberRepository.delete({});
    console.log(`Deleted ${accessNumbersDeleted.affected} access numbers`);
    
    console.log('Deleting existing books...');
    const booksDeleted = await this.bookRepository.delete({});
    console.log(`Deleted ${booksDeleted.affected} books`);
    
    console.log('Deleting existing categories...');
    const categoriesDeleted = await this.categoryRepository.delete({});
    console.log(`Deleted ${categoriesDeleted.affected} categories`);
    
    console.log('Deleting existing subjects...');
    const subjectsDeleted = await this.subjectRepository.delete({});
    console.log(`Deleted ${subjectsDeleted.affected} subjects`);
  }

  private async seedCategories() {
    const categories = [
      { 
        name: 'Fiction', 
        description: 'Imaginative works of literature including novels, short stories, and poetry',
      },
      { 
        name: 'Non-Fiction', 
        description: 'Factual works including biographies, essays, and reference materials',
      },
      { 
        name: 'Science', 
        description: 'Works covering natural and physical sciences, research, and discoveries',
      },
      { 
        name: 'History', 
        description: 'Historical accounts, analysis, and interpretations of past events',
      },
      { 
        name: 'Technology', 
        description: 'Technical literature covering computing, engineering, and applied sciences',
      },
      {
        name: 'Business',
        description: 'Books on management, entrepreneurship, and corporate topics',
      },
      {
        name: 'Self-Help',
        description: 'Personal development and self-improvement literature',
      },
      {
        name: 'Biography',
        description: 'Detailed accounts of people\'s lives and experiences',
      },
    ];

    const savedCategories = await Promise.all(
      categories.map(category => this.categoryRepository.save(category)),
    );
    console.log(`Seeded ${savedCategories.length} categories`);
    return savedCategories;
  }

  private async seedSubjects() {
    const subjects = [
      { 
        name: 'Computer Science', 
        description: 'Study of computation, algorithms, and information processing',
      },
      { 
        name: 'Mathematics', 
        description: 'Study of numbers, quantities, and shapes, and their relationships',
      },
      { 
        name: 'Physics', 
        description: 'Study of matter, energy, and the fundamental forces of nature',
      },
      { 
        name: 'Literature', 
        description: 'Study of written works, including fiction, poetry, and drama',
      },
      { 
        name: 'Philosophy', 
        description: 'Study of fundamental questions about existence, knowledge, and ethics',
      },
      {
        name: 'Economics',
        description: 'Study of production, distribution, and consumption of goods and services',
      },
      {
        name: 'Psychology',
        description: 'Scientific study of the human mind and behavior',
      },
      {
        name: 'Artificial Intelligence',
        description: 'Development of computer systems that can perform tasks requiring human intelligence',
      },
    ];

    const savedSubjects = await Promise.all(
      subjects.map(subject => this.subjectRepository.save(subject)),
    );
    console.log(`Seeded ${savedSubjects.length} subjects`);
    return savedSubjects;
  }

  private async seedBooks(categories: Category[], subjects: Subject[]) {
    const books = [
      // Technology & Computer Science
      {
        title: 'Clean Code: A Handbook of Agile Software Craftsmanship',
        author: 'Robert C. Martin',
        isbn: '9780132350884',
        ddc: '005.1',
        publisher: 'Prentice Hall',
        publicationYear: 2008,
        edition: '1st',
        description: 'Even bad code can function. But if code isn\'t clean, it can bring a development organization to its knees. This book is a must-read for every developer who wants to write better code.',
        type: BookType.PHYSICAL,
        source: BookSource.PURCHASE,
        totalCopies: 5,
        availableCopies: 3,
        coverImageUrl: 'https://m.media-amazon.com/images/I/41xShlnTZTL._SX376_BO1,204,203,200_.jpg',
        location: 'Main Library',
        shelf: 'CS-001',
        rating: 4.7,
        categories: [categories[4]], // Technology
        subjects: [subjects[0], subjects[7]], // Computer Science, AI
      },
      {
        title: 'Design Patterns: Elements of Reusable Object-Oriented Software',
        author: 'Erich Gamma, Richard Helm, Ralph Johnson, John Vlissides',
        isbn: '9780201633610',
        ddc: '005.12',
        publisher: 'Addison-Wesley Professional',
        publicationYear: 1994,
        edition: '1st',
        description: 'Capturing a wealth of experience about the design of object-oriented software, this book shows you how to solve common design problems in object-oriented ways.',
        type: BookType.PHYSICAL,
        source: BookSource.PURCHASE,
        totalCopies: 4,
        availableCopies: 2,
        coverImageUrl: 'https://m.media-amazon.com/images/I/51kuc0iWo5L._SX258_BO1,204,203,200_.jpg',
        location: 'Main Library',
        shelf: 'CS-002',
        rating: 4.7,
        categories: [categories[4]], // Technology
        subjects: [subjects[0]], // Computer Science
      },
      {
        title: 'The Pragmatic Programmer',
        author: 'Andrew Hunt, David Thomas',
        isbn: '9780201616224',
        ddc: '005.1',
        publisher: 'Addison-Wesley Professional',
        publicationYear: 1999,
        edition: '1st',
        description: 'The Pragmatic Programmer is one of those rare tech books you\'ll read, re-read, and read again over the years. Whether you\'re new to the field or an experienced practitioner, you\'ll come away with fresh insights each and every time.',
        type: BookType.PHYSICAL,
        source: BookSource.PURCHASE,
        totalCopies: 3,
        availableCopies: 1,
        coverImageUrl: 'https://m.media-amazon.com/images/I/71f743sOPoL._AC_UF1000,1000_QL80_.jpg',
        location: 'Main Library',
        shelf: 'CS-003',
        rating: 4.7,
        categories: [categories[4]], // Technology
        subjects: [subjects[0]], // Computer Science
      },
      
      // Science & Physics
      {
        title: 'A Brief History of Time',
        author: 'Stephen Hawking',
        isbn: '9780553380163',
        ddc: '523.1',
        publisher: 'Bantam',
        publicationYear: 1988,
        edition: '1st',
        description: 'A landmark volume in science writing by one of the great minds of our time, Stephen Hawking\'s book explores such profound questions as: How did the universe begin—and what made its start possible? Does time always flow forward? Is the universe unending—or are there boundaries?',
        type: BookType.PHYSICAL,
        source: BookSource.DONATION,
        from: 'John Smith Alumni Donation',
        totalCopies: 3,
        availableCopies: 3,
        coverImageUrl: 'https://m.media-amazon.com/images/I/81aY1lxk+9L._AC_UF1000,1000_QL80_.jpg',
        location: 'Science Wing',
        shelf: 'PHY-101',
        rating: 4.6,
        categories: [categories[1], categories[2]], // Non-Fiction, Science
        subjects: [subjects[2]], // Physics
      },
      {
        title: 'The Selfish Gene',
        author: 'Richard Dawkins',
        isbn: '9780192860927',
        ddc: '576.5',
        publisher: 'Oxford University Press',
        publicationYear: 1976,
        edition: '30th Anniversary Edition',
        description: 'The Selfish Gene is a 1976 book on evolution by Richard Dawkins, in which Dawkins builds upon the principal theory of George C. Williams\'s Adaptation and Natural Selection. Dawkins uses the term "selfish gene" as a way of expressing the gene-centred view of evolution (as opposed to the views focused on the organism and the group), popularizing ideas developed during the 1960s by W. D. Hamilton and others.',
        type: BookType.PHYSICAL,
        source: BookSource.PURCHASE,
        totalCopies: 2,
        availableCopies: 1,
        coverImageUrl: 'https://m.media-amazon.com/images/I/91v8uExXjLL._AC_UF1000,1000_QL80_.jpg',
        location: 'Science Wing',
        shelf: 'BIO-202',
        rating: 4.6,
        categories: [categories[1], categories[2]], // Non-Fiction, Science
        subjects: [subjects[1], subjects[5]], // Biology, Genetics
      },
      
      // Business & Self-Help
      {
        title: 'Atomic Habits',
        author: 'James Clear',
        isbn: '9780735211292',
        ddc: '158.1',
        publisher: 'Avery',
        publicationYear: 2018,
        edition: '1st',
        description: 'No matter your goals, Atomic Habits offers a proven framework for improving--every day. James Clear, one of the world\'s leading experts on habit formation, reveals practical strategies that will teach you exactly how to form good habits, break bad ones, and master the tiny behaviors that lead to remarkable results.',
        type: BookType.PHYSICAL,
        source: BookSource.PURCHASE,
        totalCopies: 4,
        availableCopies: 2,
        coverImageUrl: 'https://m.media-amazon.com/images/I/91bYsX41DVL._AC_UF1000,1000_QL80_.jpg',
        location: 'Self-Help Section',
        shelf: 'SH-101',
        rating: 4.8,
        categories: [categories[6]], // Self-Help
        subjects: [subjects[6]], // Psychology
      },
      {
        title: 'Good to Great',
        author: 'Jim Collins',
        isbn: '9780066620992',
        ddc: '658',
        publisher: 'HarperBusiness',
        publicationYear: 2001,
        edition: '1st',
        description: 'The Challenge: Built to Last, the defining management study of the nineties, showed how great companies triumph over time and how long-term sustained performance can be engineered into the DNA of an enterprise from the very beginning. But what about companies that are not born with great DNA? How can good companies, mediocre companies, even bad companies achieve enduring greatness?',
        type: BookType.PHYSICAL,
        source: BookSource.PURCHASE,
        totalCopies: 3,
        availableCopies: 1,
        coverImageUrl: 'https://m.media-amazon.com/images/I/71X1p4TGlxL._AC_UF1000,1000_QL80_.jpg',
        location: 'Business Section',
        shelf: 'BUS-101',
        rating: 4.6,
        categories: [categories[5]], // Business
        subjects: [subjects[5]], // Economics
      },
      
      // Literature & Biography
      {
        title: '1984',
        author: 'George Orwell',
        isbn: '9780451524935',
        ddc: '823.912',
        publisher: 'Signet Classic',
        publicationYear: 1949,
        edition: 'Reissue',
        description: 'Among the seminal texts of the 20th century, Nineteen Eighty-Four is a rare work that grows more haunting as its futuristic purgatory becomes more real. Published in 1949, the book offers political satirist George Orwell\'s nightmarish vision of a totalitarian, bureaucratic world and one poor stiff\'s attempt to find individuality. The brilliance of the novel is Orwell\'s prescience of modern life—the ubiquity of television, the distortion of the language—and his ability to construct such a thorough version of hell. Required reading for students since it was published, it ranks among the most terrifying novels ever written.',
        type: BookType.PHYSICAL,
        source: BookSource.DONATION,
        from: 'Library Donation Drive 2023',
        totalCopies: 2,
        availableCopies: 2,
        coverImageUrl: 'https://m.media-amazon.com/images/I/71kxa1-0mfL._AC_UF1000,1000_QL80_.jpg',
        location: 'Fiction Section',
        shelf: 'FIC-101',
        rating: 4.7,
        categories: [categories[0]], // Fiction
        subjects: [subjects[3]], // Literature
      },
      {
        title: 'Becoming',
        author: 'Michelle Obama',
        isbn: '9781524763138',
        ddc: '973.932092',
        publisher: 'Crown',
        publicationYear: 2018,
        edition: '1st',
        description: 'In a life filled with meaning and accomplishment, Michelle Obama has emerged as one of the most iconic and compelling women of our era. As First Lady of the United States of America—the first African-American to serve in that role—she helped create the most welcoming and inclusive White House in history, while also establishing herself as a powerful advocate for women and girls in the U.S. and around the world, dramatically changing the ways that families pursue healthier, more active lives, and standing with her husband as he led America through some of its most harrowing moments.',
        type: BookType.PHYSICAL,
        source: BookSource.PURCHASE,
        totalCopies: 3,
        availableCopies: 3,
        coverImageUrl: 'https://m.media-amazon.com/images/I/81h2gWPTYJL._AC_UF1000,1000_QL80_.jpg',
        location: 'Biography Section',
        shelf: 'BIO-001',
        rating: 4.9,
        categories: [categories[1], categories[7]], // Non-Fiction, Biography
        subjects: [subjects[3]], // Literature
      },
      
      // History & Philosophy
      {
        title: 'Sapiens: A Brief History of Humankind',
        author: 'Yuval Noah Harari',
        isbn: '9780062316097',
        ddc: '909',
        publisher: 'Harper',
        publicationYear: 2015,
        edition: '1st',
        description: 'From a renowned historian comes a groundbreaking narrative of humanity\'s creation and evolution—a #1 international bestseller—that explores the ways in which biology and history have defined us and enhanced our understanding of what it means to be "human."',
        type: BookType.PHYSICAL,
        source: BookSource.PURCHASE,
        totalCopies: 2,
        availableCopies: 1,
        coverImageUrl: 'https://m.media-amazon.com/images/I/713jIoMO3UL._AC_UF1000,1000_QL80_.jpg',
        location: 'History Section',
        shelf: 'HIS-101',
        rating: 4.7,
        categories: [categories[1], categories[3]], // Non-Fiction, History
        subjects: [subjects[4]], // Philosophy
      },
      {
        title: 'Meditations',
        author: 'Marcus Aurelius',
        isbn: '9780812968255',
        ddc: '188',
        publisher: 'Modern Library',
        publicationYear: 180,
        edition: 'Modern Library Edition',
        description: 'A series of personal writings by Marcus Aurelius, Roman Emperor from 161 to 180 AD, recording his private notes to himself and ideas on Stoic philosophy. Marcus Aurelius wrote the 12 books of the Meditations in Koine Greek as a source for his own guidance and self-improvement. These writings take the form of quotations varying in length from one sentence to long paragraphs.',
        type: BookType.PHYSICAL,
        source: BookSource.DONATION,
        from: 'Classics Collection Donation',
        totalCopies: 1,
        availableCopies: 0,
        coverImageUrl: 'https://m.media-amazon.com/images/I/71r5J5zTgLL._AC_UF1000,1000_QL80_.jpg',
        location: 'Rare Books Collection',
        shelf: 'RARE-001',
        rating: 4.7,
        categories: [categories[1], categories[3]], // Non-Fiction, History
        subjects: [subjects[4]], // Philosophy
      },
    ];

    for (const bookData of books) {
      try {
        console.log(`\nProcessing book: "${bookData.title}"`);
        
        // Create the book
        const book = await this.bookRepository.save(this.bookRepository.create({
          ...bookData,
          // Ensure we only pass the category and subject IDs
          categories: bookData.categories.map(c => ({ id: c.id })),
          subjects: bookData.subjects.map(s => ({ id: s.id })),
        }));
        
        console.log(`✅ Created book: "${book.title}" (ID: ${book.id})`);
        console.log(`   - Categories: ${bookData.categories.map(c => c.name).join(', ')}`);
        console.log(`   - Subjects: ${bookData.subjects.map(s => s.name).join(', ')}`);
        console.log(`   - Copies: ${bookData.totalCopies} (${bookData.availableCopies} available)`);

        // Create access numbers for each copy
        const accessNumbers: Partial<AccessNumber>[] = [];
        
        for (let i = 1; i <= bookData.totalCopies; i++) {
          const accessNumber = i.toString().padStart(3, '0');
          accessNumbers.push({
            number: accessNumber,
            bookId: book.id,
          });
        }
        
        // Save all access numbers in a single batch
        if (accessNumbers.length > 0) {
          const savedAccessNumbers = await this.accessNumberRepository.save(accessNumbers);
          console.log(`   - Generated ${savedAccessNumbers.length} access numbers (${bookData.availableCopies} available)`);
        }
      } catch (error) {
        console.error(`❌ Error processing book "${bookData.title}":`, error);
        // Continue with the next book even if one fails
      }
    }
  }
}
