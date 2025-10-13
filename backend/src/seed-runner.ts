import 'reflect-metadata';
import { DataSource } from 'typeorm';
import { config } from 'dotenv';
import * as path from 'path';

// Load environment variables
config({ path: path.resolve(__dirname, '../.env') });

// Import the data source configuration
import dataSource from './database/data-source';
import { DatabaseSeeder } from './database/seeds';

async function runSeed() {
  console.log('Starting database seeding...');

  try {
    // Initialize the data source
    await dataSource.initialize();
    console.log('Data Source has been initialized!');

    // Run the seeder
    const seeder = new DatabaseSeeder(dataSource);
    await seeder.run();
  } catch (error) {
    console.error('Error during seeding:', error);
    process.exit(1);
  } finally {
    // Close the data source connection
    if (dataSource.isInitialized) {
      await dataSource.destroy();
      console.log('Data Source has been closed');
    }
    process.exit(0);
  }
}

runSeed();
