import 'reflect-metadata';
import { DataSource } from 'typeorm';
import { config } from 'dotenv';
import * as path from 'path';

// Load environment variables
config({ path: path.resolve(__dirname, '../.env') });

// Import data source configuration
import dataSource from '../src/database/data-source';

// Import entities
import { UserRole } from '../src/sys-configs/user-roles/entities/user-role.entity';
import { User } from '../src/users/entities/user.entity';
import { Membership } from '../src/membership/entities/membership.entity';
import { MembershipType } from '../src/sys-configs/membership-types/entities/membership-type.entity';

interface ResetConfig {
  name: string;
  entityClass: any;
  tableName: string;
  dependencies: string[];
}

const RESET_CONFIGS: ResetConfig[] = [
  {
    name: 'Membership',
    entityClass: Membership,
    tableName: 'memberships',
    dependencies: ['User', 'MembershipType'],
  },
  {
    name: 'User',
    entityClass: User,
    tableName: 'users',
    dependencies: ['UserRole'],
  },
  {
    name: 'MembershipType',
    entityClass: MembershipType,
    tableName: 'membership_types',
    dependencies: [],
  },
  {
    name: 'UserRole',
    entityClass: UserRole,
    tableName: 'user_roles',
    dependencies: [],
  },
];

async function resetUserRelatedTables(): Promise<void> {
  console.log('Starting reset of user-related tables...');

  try {
    // Initialize data source
    await dataSource.initialize();
    console.log('Data Source has been initialized!');

    // Get database type
    const dbType = dataSource.options.type;
    console.log(`Database type: ${dbType}`);

    // Disable foreign key checks for MySQL
    if (dbType === 'mysql') {
      await dataSource.query('SET FOREIGN_KEY_CHECKS = 0');
      console.log('Disabled foreign key checks');
    }

    // Reset tables in dependency order
    for (const config of RESET_CONFIGS) {
      await resetTable(config, dbType);
    }

    // Re-enable foreign key checks for MySQL
    if (dbType === 'mysql') {
      await dataSource.query('SET FOREIGN_KEY_CHECKS = 1');
      console.log('Re-enabled foreign key checks');
    }

    console.log('✅ All user-related tables reset successfully!');

  } catch (error) {
    console.error('Error during table reset:', error);
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

async function resetTable(config: ResetConfig, dbType: string): Promise<void> {
  try {
    console.log(`\n🔄 Resetting ${config.name} table...`);

    // Get repository
    const repository = dataSource.getRepository(config.entityClass);

    // Check current count
    const count = await repository.count();
    console.log(`Current ${config.name} count: ${count}`);

    if (count === 0) {
      console.log(`✅ ${config.name} table is already empty`);
      return;
    }

    // Delete all data
    await dataSource.query(`DELETE FROM ${config.tableName}`);
    console.log(`✅ Cleared all ${config.name} records`);

    // Reset auto-increment counter
    if (dbType === 'mysql') {
      await dataSource.query(`ALTER TABLE ${config.tableName} AUTO_INCREMENT = 1`);
    } else if (dbType === 'sqlite') {
      await dataSource.query(`DELETE FROM sqlite_sequence WHERE name='${config.tableName}'`);
    }
    console.log(`✅ Reset auto-increment counter for ${config.name}`);

  } catch (error) {
    console.error(`❌ Error resetting ${config.name}:`, error.message);
    throw error;
  }
}

// Run the reset
resetUserRelatedTables();
