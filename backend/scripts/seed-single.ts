import 'reflect-metadata';
import { DataSource } from 'typeorm';
import { config } from 'dotenv';
import * as path from 'path';

// Load environment variables
config({ path: path.resolve(__dirname, '../.env') });

// Import data source configuration
import dataSource from '../src/database/data-source';

// Import entity repositories
import { Category } from '../src/sys-configs/categories/entities/category.entity';
import { Subject } from '../src/sys-configs/subjects/entities/subject.entity';
import { Type } from '../src/sys-configs/types/entities/type.entity';
import { Source } from '../src/sys-configs/sources/entities/source.entity';
import { Location } from '../src/sys-configs/locations/entities/location.entity';
import { Shelf } from '../src/sys-configs/shelves/entities/shelf.entity';
import { Publisher } from '../src/sys-configs/publishers/entities/publisher.entity';
import { MembershipType } from '../src/sys-configs/membership-types/entities/membership-type.entity';
import { Degree } from '../src/sys-configs/degrees/entities/degree.entity';
import { UserRole } from '../src/sys-configs/user-roles/entities/user-role.entity';
import { User } from '../src/users/entities/user.entity';
import { Membership } from '../src/membership/entities/membership.entity';

interface SeederConfig {
  entityName: string;
  entityClass: any;
  seedFile: string;
}

const AVAILABLE_SEEDERS: SeederConfig[] = [
  { entityName: 'Category', entityClass: Category, seedFile: 'categories' },
  { entityName: 'Subject', entityClass: Subject, seedFile: 'subjects' },
  { entityName: 'Type', entityClass: Type, seedFile: 'types' },
  { entityName: 'Source', entityClass: Source, seedFile: 'sources' },
  { entityName: 'Location', entityClass: Location, seedFile: 'locations' },
  { entityName: 'Shelf', entityClass: Shelf, seedFile: 'shelves' },
  { entityName: 'Publisher', entityClass: Publisher, seedFile: 'publishers' },
  { entityName: 'MembershipType', entityClass: MembershipType, seedFile: 'membership-types' },
  { entityName: 'Degree', entityClass: Degree, seedFile: 'degrees' },
  { entityName: 'UserRole', entityClass: UserRole, seedFile: 'user-roles' },
  { entityName: 'User', entityClass: User, seedFile: 'users' },
  { entityName: 'Membership', entityClass: Membership, seedFile: 'memberships' },
];

async function resetAndSeedTable(entityName: string): Promise<void> {
  console.log(`Starting reset and seed for ${entityName}...`);

  try {
    // Initialize data source
    await dataSource.initialize();
    console.log('Data Source has been initialized!');

    // Find the seeder config
    const seederConfig = AVAILABLE_SEEDERS.find(s => s.entityName.toLowerCase() === entityName.toLowerCase());
    
    if (!seederConfig) {
      console.error(`Entity ${entityName} not found in available seeders`);
      console.log('Available entities:', AVAILABLE_SEEDERS.map(s => s.entityName).join(', '));
      return;
    }

    // Get repository
    const repository = dataSource.getRepository(seederConfig.entityClass);

    // Check if table exists and has data
    const count = await repository.count();
    console.log(`Current ${entityName} count: ${count}`);

    // Delete all existing data (handle foreign key constraints safely)
    if (dataSource.options.type === 'mysql') {
      // For MySQL: Temporarily disable foreign key checks
      await dataSource.query('SET FOREIGN_KEY_CHECKS = 0');
      await repository.query(`DELETE FROM ${repository.metadata.tableName}`);
      await dataSource.query('SET FOREIGN_KEY_CHECKS = 1');
    } else {
      // For SQLite: Use DELETE FROM (respects FK by default but may need cascade)
      await repository.query(`DELETE FROM ${repository.metadata.tableName}`);
    }
    console.log(`Cleared all ${entityName} records`);

    // Reset auto-increment counter (database-specific)
    if (dataSource.options.type === 'mysql') {
      await dataSource.query(`ALTER TABLE ${repository.metadata.tableName} AUTO_INCREMENT = 1`);
    } else if (dataSource.options.type === 'sqlite') {
      await dataSource.query(`DELETE FROM sqlite_sequence WHERE name='${repository.metadata.tableName}'`);
    }
    console.log(`Reset auto-increment counter for ${entityName}`);

    // Import and run the specific seeder
    const seederPath = path.resolve(__dirname, `../src/database/seeds/entities/${seederConfig.seedFile}.seed.ts`);
    const seederModule = require(seederPath);
    const seederClass = seederModule.default || seederModule[Object.keys(seederModule)[0]];
    const seeder = new seederClass();
    const result = await seeder.run(dataSource);

    console.log(`Seeding completed for ${entityName}:`, result);

  } catch (error) {
    console.error(`Error during ${entityName} seeding:`, error);
    process.exit(1);
  } finally {
    // Close data source connection
    if (dataSource.isInitialized) {
      await dataSource.destroy();
      console.log('Data Source has been closed');
    }
    process.exit(0);
  }
}

// Get entity name from command line arguments
const entityName = process.argv[2];

if (!entityName) {
  console.log('Usage: npm run seed-single <entity-name>');
  console.log('Available entities:');
  AVAILABLE_SEEDERS.forEach(seeder => {
    console.log(`  - ${seeder.entityName.toLowerCase()}`);
  });
  process.exit(1);
}

// Run the seeder
resetAndSeedTable(entityName);
