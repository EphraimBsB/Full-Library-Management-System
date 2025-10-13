import { DataSource, In, Not } from 'typeorm';
import { ISeeder, SeedResult } from '../base-seed.interface';
import { BookLoan, LoanStatus } from '../../../books/entities/book-loan.entity';
import { BookCopy, BookCopyStatus } from '../../../books/entities/book-copy.entity';
import { User } from '../../../users/entities/user.entity';
import { Membership, MembershipStatus } from '../../../membership/entities/membership.entity';
import { Book } from '../../../books/entities/book.entity';
import { faker } from '@faker-js/faker';

// Helper function to get random status with weighted distribution
const getWeightedStatus = (dueDate: Date): LoanStatus => {
  const now = new Date();
  const isOverdue = dueDate < now;
  const rand = Math.random();
  
  if (isOverdue) {
    if (rand < 0.7) return LoanStatus.OVERDUE;
    if (rand < 0.9) return LoanStatus.RETURNED;
    return LoanStatus.LOST;
  }
  
  if (rand < 0.8) return LoanStatus.ACTIVE;
  if (rand < 0.9) return LoanStatus.RETURNED;
  return LoanStatus.LOST;
};

// Helper function to calculate due date based on membership type
const calculateDueDate = (startDate: Date, membershipType: string): Date => {
  const dueDate = new Date(startDate);
  
  switch (membershipType.toLowerCase()) {
    case 'student':
      dueDate.setDate(dueDate.getDate() + 21); // 3 weeks
      break;
    case 'faculty':
    case 'researcher':
      dueDate.setDate(dueDate.getDate() + 42); // 6 weeks
      break;
    case 'premium':
      dueDate.setDate(dueDate.getDate() + 60); // ~2 months
      break;
    default: // Regular, Alumni, etc.
      dueDate.setDate(dueDate.getDate() + 14); // 2 weeks
  }
  
  return dueDate;
};

export class BookLoansSeed implements ISeeder {
  public async run(dataSource: DataSource): Promise<SeedResult> {
    console.log('Seeding book loans...');
    const bookLoanRepository = dataSource.getRepository(BookLoan);
    const bookCopyRepository = dataSource.getRepository(BookCopy);
    const userRepository = dataSource.getRepository(User);
    const membershipRepository = dataSource.getRepository(Membership);
    const bookRepository = dataSource.getRepository(Book);

    // Get active memberships with their users and types
    const memberships = await membershipRepository.find({
      where: { status: MembershipStatus.ACTIVE },
      relations: ['user', 'type'],
      take: 30 // Limit to 30 members
    });

    if (memberships.length === 0) {
      console.warn('No active memberships found. Please seed memberships first.');
      return { entity: 'BookLoan', count: 0 };
    }

    // Get available book copies with their books
    const availableCopies = await bookCopyRepository.find({
      where: { status: BookCopyStatus.AVAILABLE },
      relations: ['book'],
      take: 100 // Limit to 100 copies to keep it manageable
    });

    if (availableCopies.length === 0) {
      console.warn('No available book copies found. Please seed book copies first.');
      return { entity: 'BookLoan', count: 0 };
    }

    const loans: BookLoan[] = [];
    const now = new Date();
    
    // Create 1-3 loans per member
    for (const membership of memberships) {
      const loanCount = 1 + Math.floor(Math.random() * 3);
      
      for (let i = 0; i < loanCount && availableCopies.length > 0; i++) {
        // Get a random available copy and remove it from the array
        const copyIndex = Math.floor(Math.random() * availableCopies.length);
        const [copy] = availableCopies.splice(copyIndex, 1);
        
        // Determine loan period based on membership type
        const borrowedAt = faker.date.between({
          from: new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000), // Up to 90 days ago
          to: now
        });
        
        const dueDate = calculateDueDate(borrowedAt, membership.type.name);
        const status = getWeightedStatus(dueDate);
        
        // Create a new BookLoan instance
        const loan = new BookLoan();
        
        // Set relationships
        loan.bookCopy = copy;
        loan.user = membership.user;
        loan.membership = membership;
        
        // Set timestamps
        loan.borrowedAt = borrowedAt;
        loan.dueDate = dueDate;
        
        // Set status-specific properties
        if (status === LoanStatus.RETURNED) {
          loan.returnedAt = faker.date.between({
            from: borrowedAt,
            to: dueDate < now ? now : dueDate
          });
          loan.status = LoanStatus.RETURNED;
          
          // Mark copy as available again
          copy.status = BookCopyStatus.AVAILABLE;
        } else if (status === LoanStatus.OVERDUE) {
          loan.status = LoanStatus.OVERDUE;
          
          // Calculate fine (1-10% of book price per week overdue, max 4 weeks)
          const weeksOverdue = Math.min(
            Math.ceil((now.getTime() - dueDate.getTime()) / (7 * 24 * 60 * 60 * 1000)),
            4 // Cap at 4 weeks
          );
          
          if (weeksOverdue > 0) {
            // Get book price using a raw query to avoid the distinctAlias issue
            const [priceResult] = await dataSource.manager.query(
              'SELECT price FROM books WHERE id = ?',
              [copy.book.id]
            );
            const bookPrice = priceResult?.price ? parseFloat(priceResult.price) : 20; // Default to $20 if price not set
            const finePerWeek = bookPrice * (0.01 * (1 + Math.floor(Math.random() * 10))); // 1-10% of book price
            loan.fineAmount = parseFloat((weeksOverdue * finePerWeek).toFixed(2));
          }
        } else if (status === LoanStatus.LOST) {
          loan.status = LoanStatus.LOST;
          loan.notes = 'Reported lost by patron';
          
          // Set fine to replacement cost (2x book price)
          const [priceResult] = await dataSource.manager.query(
            'SELECT price FROM books WHERE id = ?',
            [copy.book.id]
          );
          const bookPrice = priceResult?.price ? parseFloat(priceResult.price) : 20;
          loan.fineAmount = bookPrice * 2; // 2x book price
          
          // Mark copy as lost
          copy.status = BookCopyStatus.LOST;
        } else { // ACTIVE
          loan.status = LoanStatus.ACTIVE;
          
          // 20% chance of being renewed
          if (Math.random() < 0.2) {
            loan.renewalCount = 1;
            loan.lastRenewedAt = faker.date.between({
              from: borrowedAt,
              to: now
            });
            
            // Extend due date by the same period
            const newDueDate = calculateDueDate(loan.lastRenewedAt, membership.type.name);
            loan.dueDate = newDueDate;
          }
        }
        
        // Save the updated copy status
        await bookCopyRepository.save(copy);
        
        // Set timestamps
        loan.createdAt = borrowedAt;
        loan.updatedAt = new Date();
        
        loans.push(loan);
      }
    }

    // Process in batches to avoid memory issues
    const batchSize = 50;
    let created = 0;
    
    for (let i = 0; i < loans.length; i += batchSize) {
      const batch = loans.slice(i, i + batchSize);
      try {
        await bookLoanRepository.save(batch);
        created += batch.length;
        console.log(`Processed batch of ${batch.length} book loans (${Math.min(i + batch.length, loans.length)}/${loans.length})`);
      } catch (error) {
        console.error(`Error saving batch ${i / batchSize + 1}:`, error);
      }
    }

    // Update book available copies count in a more reliable way
    try {
      // First, get all affected book IDs from the loans
      const bookIds = Array.from(new Set(
        loans
          .map(loan => loan.bookCopy?.book?.id)
          .filter((id): id is number => id !== undefined && id !== null)
      ));

      if (bookIds.length > 0) {
        // First, reset all affected books' available copies to 0
        await dataSource.manager.query(
          `UPDATE books SET availableCopies = 0 WHERE id IN (${bookIds.map(() => '?').join(',')})`,
          bookIds
        );
        
        // Then update the count of available copies for each book
        await dataSource.manager.query(`
          UPDATE books b
          INNER JOIN (
            SELECT 
              bc.bookId,
              COUNT(bc.id) as available_count
            FROM book_copies bc
            LEFT JOIN book_loans bl ON (
              bl.bookCopyId = bc.id 
              AND bl.status IN (?) 
              AND bl.returnedAt IS NULL 
              AND bl.deleted_at IS NULL
            )
            WHERE 
              bc.status = ? 
              AND bc.deleted_at IS NULL
              AND bl.id IS NULL
              AND bc.bookId IN (${bookIds.map(() => '?').join(',')})
            GROUP BY bc.bookId
          ) AS available ON available.bookId = b.id
          SET b.availableCopies = available.available_count,
              b.updated_at = NOW()
          WHERE b.id IN (${bookIds.map(() => '?').join(',')})
        `, [
          [LoanStatus.ACTIVE, LoanStatus.OVERDUE],
          BookCopyStatus.AVAILABLE,
          ...bookIds,
          ...bookIds  // Add bookIds again for the WHERE IN clause
        ]);
      }
    } catch (error) {
      console.error('Error updating available copies:', error);
    }
    return {
      entity: 'BookLoan',
      count: created,
      details: {
        active: loans.filter(l => l.status === LoanStatus.ACTIVE).length,
        returned: loans.filter(l => l.status === LoanStatus.RETURNED).length,
        overdue: loans.filter(l => l.status === LoanStatus.OVERDUE).length,
        lost: loans.filter(l => l.status === LoanStatus.LOST).length,
        withFines: loans.filter(l => l.fineAmount > 0).length
      }
    };
  }
}
