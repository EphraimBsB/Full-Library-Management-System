import { DataSource, QueryRunner } from 'typeorm';
import { ReferenceSeeder } from './reference.seeder';
import { BookSeeder } from './book.seeder';
import { UserSeeder } from './user.seeder';
import { BorrowedBookSeeder } from './borrowed-book.seeder';
import { BookRequestSeeder } from './seed-book-requests';

/**
 * Main database seeder class that coordinates all seeders
 * in the correct order with proper dependency injection
 */
export default class MainSeeder {
  constructor(private dataSource: DataSource) {}

  /**
   * Main method to run all seeders in the correct order
   */
  /**
   * Run any pending migrations before seeding
   */
  private async runMigrations(queryRunner: QueryRunner): Promise<void> {
    console.log('🔄 Checking for pending migrations...');
    await this.dataSource.runMigrations({ transaction: 'all' });
    console.log('✅ Database is up to date');
  }

  public async run(): Promise<void> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    
    try {
      const startTime = Date.now();
      await queryRunner.startTransaction();
      console.log('🚀 Starting database seeding...');
      
      // Run any pending migrations first
      await this.runMigrations(queryRunner);

      // Clear existing data first
      console.log('🧹 Clearing existing data...');
      await this.clearDatabase(queryRunner);
      console.log('✅ Database cleared successfully');

      // Initialize seeders with the query runner
      const seeders = {
        reference: new ReferenceSeeder(this.dataSource),
        book: new BookSeeder(this.dataSource),
        user: new UserSeeder(this.dataSource),
        borrowedBook: new BorrowedBookSeeder(this.dataSource),
        bookRequest: new BookRequestSeeder(this.dataSource)
      };

      try {
        // Seed reference data (categories and subjects) first
        console.log('\n🌱 Seeding reference data...');
        const { categories, subjects } = await seeders.reference.seed(queryRunner);
        console.log(`✅ Seeded ${categories.length} categories and ${subjects.length} subjects`);

        // Then seed books and their access numbers
        console.log('\n📚 Seeding books and access numbers...');
        const books = await seeders.book.seed(queryRunner, categories, subjects);
        console.log(`✅ Seeded ${books.length} books with their access numbers`);

        // Then seed users
        console.log('\n👥 Seeding users...');
        const users = await seeders.user.seed(queryRunner);
        console.log(`✅ Seeded ${users.length} users`);

        // Seed borrowed books
        console.log('\n📖 Seeding borrowed books...');
        const borrowedBooks = await seeders.borrowedBook.seed(queryRunner);
        console.log(`✅ Seeded ${borrowedBooks.length} borrowed book records`);

        // Seed book requests
        console.log('\n📋 Seeding book requests...');
        const bookRequests = await seeders.bookRequest.seed(queryRunner, users, books);
        console.log(`✅ Seeded ${bookRequests.length} book requests`);

        await queryRunner.commitTransaction();
        const duration = ((Date.now() - startTime) / 1000).toFixed(2);
        console.log(`\n🎉 Database seeding completed successfully in ${duration}s!`);
      } catch (error) {
        console.error('\n❌ Error during seeding:', error);
        await queryRunner.rollbackTransaction();
        throw error;
      }
    } catch (error) {
      console.error('\n❌ Critical error during database seeding:', error);
      throw error;
    } finally {
      if (queryRunner.isReleased === false) {
        await queryRunner.release();
      }
    }
  }

  /**
   * Clear all data from the database
   */
  private async clearDatabase(queryRunner: QueryRunner) {
    console.log('🧹 Clearing existing data...');
    
    // Disable foreign key checks
    await queryRunner.query('SET FOREIGN_KEY_CHECKS = 0');

    // List all tables in the correct order to respect foreign key constraints
    const tables = [
      'borrowed_books',
      'book_requests',
      'books',
      'users',
      'access_numbers',
      'book_subjects',
      'subjects',
      'categories',
    ];

    try {
      // Clear each table
      for (const table of tables) {
        try {
          await queryRunner.query(`TRUNCATE TABLE \`${table}\`;`);
          
          // Then reset auto-increment counter if the table has an auto-increment column
          if (!table.includes('_')) { // Skip join tables for ALTER TABLE
            try {
              await queryRunner.query(`ALTER TABLE \`${table}\` AUTO_INCREMENT = 1`);
            } catch (alterError) {
              // Ignore if the table doesn't have an auto-increment column
            }
          }
        } catch (error) {
          console.warn(`⚠️  Could not clear table ${table}: ${error.message}`);
        }
      }
    } finally {
      // Re-enable foreign key checks
      await queryRunner.query('SET FOREIGN_KEY_CHECKS = 1');
    }
    console.log('✅ Database cleared successfully');
  }
}
