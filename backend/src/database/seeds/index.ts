import { DataSource } from 'typeorm';
import { ISeeder, SeedResult } from './base-seed.interface';
// System Configurations
import { UserRolesSeed } from './entities/user-roles.seed';
import { MembershipTypesSeed } from './entities/membership-types.seed';
import { CategoriesSeed } from './entities/categories.seed';
import { SourcesSeed } from './entities/sources.seed';
import { TypesSeed } from './entities/types.seed';
import { SubjectsSeed } from './entities/subjects.seed';
import { DegreesSeed } from './entities/degrees.seed';

// Users and Memberships
import { UsersSeed } from './entities/users.seed';
import { MembershipsSeed } from './entities/memberships.seed';
import { MembershipRequestsSeed } from './entities/membership-requests.seed';

// Books Module
import { BooksSeed } from './entities/books.seed';
import { BookCopiesSeed } from './entities/book-copies.seed';
import { BookLoansSeed } from './entities/book-loans.seed';
import { BookRequestsSeed } from './entities/book-requests.seed';
import { QueueEntriesSeed } from './entities/queue-entries.seed';

// Notifications
import { NotificationsSeed } from './entities/notifications.seed';
import { BookFavoritesSeed } from './entities/book-favorites.seed';
import { BookNotesSeed } from './entities/book-notes.seed';
import { InhouseUsageSeed } from './entities/inhouse-usage.seed';

export class DatabaseSeeder {
  private seeders: ISeeder[] = [];
  private results: SeedResult[] = [];

  constructor(private dataSource: DataSource) {
    // Add all seeders in the desired order
    this.seeders = [
      // System configurations first
      new UserRolesSeed(),
      new MembershipTypesSeed(),
      new CategoriesSeed(),
      new SourcesSeed(),
      new TypesSeed(),
      new SubjectsSeed(),
      new DegreesSeed(),
      
      // Then users and memberships
      new UsersSeed(),
      new MembershipsSeed(),
      new MembershipRequestsSeed(),
      
      // Then books and related entities
      new BooksSeed(),
      new BookCopiesSeed(),
      new BookLoansSeed(),
      new BookRequestsSeed(),
      new QueueEntriesSeed(),
      new BookFavoritesSeed(),
      new BookNotesSeed(),
      new InhouseUsageSeed(),
      
      // Then notifications
      new NotificationsSeed()
    ];
  }

  public async run(): Promise<SeedResult[]> {
    console.log('Starting database seeding...');
    
    // Run all seeders in sequence
    for (const seeder of this.seeders) {
      try {
        const result = await seeder.run(this.dataSource);
        this.results.push(result);
        console.log(`✅ Seeded ${result.entity}: ${result.count} records`);
      } catch (error) {
        console.error(`❌ Error seeding ${seeder.constructor.name}:`, error);
        throw error;
      }
    }

    console.log('\nSeeding completed!');
    this.printResults();
    return this.results;
  }

  private printResults(): void {
    console.log('\n=== Seeding Summary ===');
    console.table(this.results);
    
    const total = this.results.reduce((sum, result) => sum + result.count, 0);
    console.log(`\nTotal records created: ${total}\n`);
  }
}

export async function runSeed(dataSource: DataSource): Promise<SeedResult[]> {
  const seeder = new DatabaseSeeder(dataSource);
  return seeder.run();
}

// For running directly with ts-node
if (require.main === module) {
  (async () => {
    try {
      const dataSource = new DataSource(require('../../ormconfig'));
      const results = await runSeed(dataSource);
      console.log('Seeding completed successfully!');
      console.table(results);
      process.exit(0);
    } catch (error) {
      console.error('Error during seeding:', error);
      process.exit(1);
    }
  })();
}
