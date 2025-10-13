import { DataSource } from 'typeorm';
import { ISeeder, SeedResult } from '../base-seed.interface';
import { BookRequest, BookRequestStatus } from '../../../books/entities/book-request.entity';
import { Book } from '../../../books/entities/book.entity';
import { User } from '../../../users/entities/user.entity';
import { faker } from '@faker-js/faker';
import { Membership, MembershipStatus } from '../../../membership/entities/membership.entity';

// Helper function to get random status with weighted distribution
const getWeightedStatus = (): BookRequestStatus => {
  const rand = Math.random();
  if (rand < 0.4) return BookRequestStatus.PENDING;
  if (rand < 0.7) return BookRequestStatus.APPROVED;
  if (rand < 0.9) return BookRequestStatus.FULFILLED;
  return BookRequestStatus.REJECTED;
};

// Helper function to generate realistic request reasons
const generateRequestReason = (bookTitle: string): string => {
  const reasons = [
    `Required for ${faker.helpers.arrayElement(['course', 'research', 'thesis', 'personal interest'])}`,
    `Recommended by ${faker.helpers.arrayElement(['professor', 'friend', 'librarian', 'colleague'])}`,
    `Need for ${faker.helpers.arrayElement(['academic reference', 'book club', 'teaching preparation', 'project work'])}`,
    `Previous edition was helpful, interested in updates`,
    `Citation in another work, need to reference`,
    `Part of required reading for ${faker.helpers.arrayElement(['course', 'seminar', 'workshop'])}`
  ];
  
  return `${faker.helpers.arrayElement(reasons)}: ${bookTitle}`;
};

export class BookRequestsSeed implements ISeeder {
  public async run(dataSource: DataSource): Promise<SeedResult> {
    console.log('Seeding book requests...');
    const bookRequestRepository = dataSource.getRepository(BookRequest);
    const bookRepository = dataSource.getRepository(Book);
    const userRepository = dataSource.getRepository(User);
    const membershipRepository = dataSource.getRepository(Membership);

    // Get books with low availability (0-2 copies)
    const books = await bookRepository
      .createQueryBuilder('book')
      .where('book.availableCopies <= 2')
      .orderBy('RAND()') // Changed from RANDOM() to RAND() for MySQL
      .take(20) // Limit to 20 books to keep the dataset manageable
      .getMany();

    if (books.length === 0) {
      console.warn('No books with low availability found. Please seed books first.');
      return { entity: 'BookRequest', count: 0 };
    }

    // Get active members with their memberships
    const members = await membershipRepository.find({
      where: { status: MembershipStatus.ACTIVE },
      relations: ['user', 'type'],
      take: 30 // Limit to 30 members
    });

    if (members.length === 0) {
      console.warn('No active members found. Please seed memberships first.');
      return { entity: 'BookRequest', count: 0 };
    }

    const requests: BookRequest[] = [];
    const now = new Date();
    
    // Create requests for books
    for (const book of books) {
      // Determine how many requests to create (1 to 5 per book)
      const requestCount = 1 + Math.floor(Math.random() * 5);
      
      for (let i = 0; i < requestCount && i < members.length; i++) {
        const member = members[(i * 7) % members.length]; // Distribute users across requests
        const status = getWeightedStatus();
        
        // Create a date within the last 90 days
        const requestDate = faker.date.recent({ days: 90 });
        
        // Create a new BookRequest instance
        const request = new BookRequest();
        
        // Set the relationships
        request.book = book;
        request.user = member.user;
        
        // Set the properties
        request.status = status;
        request.reason = generateRequestReason(book.title);
        // Priority is not a field in the entity, so we'll store it in the reason
        const priority = faker.helpers.arrayElement(['LOW', 'MEDIUM', 'HIGH']);
        request.reason = `[${priority} PRIORITY] ${request.reason}`;
        
        // Get admin user for approvals/rejections
        const adminUser = await userRepository.findOne({
          where: { role: { name: 'Admin' } },
          select: ['id']
        });

        // Set status-specific timestamps and properties
        switch (status) {
          case BookRequestStatus.APPROVED: {
            request.approvedAt = faker.date.between({
              from: requestDate,
              to: new Date()
            });
            request.approvedById = adminUser?.id || null;
            request.reason = `${request.reason} - ${faker.lorem.sentence()}`;
            break;
          }
          
          case BookRequestStatus.REJECTED: {
            request.rejectedAt = faker.date.between({
              from: requestDate,
              to: new Date()
            });
            request.rejectedById = adminUser?.id || null;
            request.rejectionReason = faker.helpers.arrayElement([
              'Book is reserved for course use',
              'Maximum request limit reached',
              'Member has outstanding fines',
              'Requested item is on order',
              'Item is in high demand',
              'Member needs to verify account',
              'Item is in processing',
              'Restricted access material'
            ]);
            request.reason = `${request.reason} - ${faker.lorem.sentence()}`;
            break;
          }
          
          case BookRequestStatus.FULFILLED: {
            // For fulfilled requests, ensure approvedAt is before fulfilledAt
            const now = new Date();
            const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
            
            request.approvedAt = faker.date.between({
              from: new Date(requestDate.getTime() - 30 * 24 * 60 * 60 * 1000), // Ensure approved after request
              to: oneWeekAgo  // Approved at least a week ago
            });
            
            request.fulfilledAt = faker.date.between({
              from: request.approvedAt,
              to: now
            });
            
            request.approvedById = adminUser?.id || null;
            request.reason = `${request.reason} - Fulfilled on ${request.fulfilledAt?.toLocaleDateString()}`;
            break;
          }
          
          case BookRequestStatus.PENDING:
          default: {
            const statusNote = faker.helpers.arrayElement([
              'Awaiting approval',
              'Pending review by librarian',
              'Verification in progress',
              'Waiting for next available copy'
            ]);
            request.reason = `${request.reason} - ${statusNote}`;
            break;
          }
        }
        
        // Set timestamps
        request.createdAt = requestDate;
        request.updatedAt = requestDate;

        requests.push(request);
      }
    }

    // Process in batches to avoid memory issues
    const batchSize = 50;
    let created = 0;
    
    for (let i = 0; i < requests.length; i += batchSize) {
      const batch = requests.slice(i, i + batchSize);
      try {
        await bookRequestRepository.save(batch);
        created += batch.length;
        console.log(`Processed batch of ${batch.length} book requests (${Math.min(i + batch.length, requests.length)}/${requests.length})`);
      } catch (error) {
        console.error(`Error saving batch ${i / batchSize + 1}:`, error);
      }
    }

    console.log(`Created ${created} book requests`);
    return {
      entity: 'BookRequest',
      count: created,
      details: {
        pending: requests.filter(r => r.status === BookRequestStatus.PENDING).length,
        approved: requests.filter(r => r.status === BookRequestStatus.APPROVED).length,
        fulfilled: requests.filter(r => r.status === BookRequestStatus.FULFILLED).length,
        rejected: requests.filter(r => r.status === BookRequestStatus.REJECTED).length
      }
    };
  }
}
