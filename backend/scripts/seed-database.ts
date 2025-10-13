import 'reflect-metadata';
import { DataSource } from 'typeorm';
import { config } from 'dotenv';
import { runSeed } from '../src/database/seeds';

// Load environment variables
config({ path: '.env' });

// Initialize the database connection
const dataSource = new DataSource({
  type: 'mysql',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '3306', 10),
  username: process.env.DB_USERNAME || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_DATABASE || 'library_db',
  entities: [
    'src/**/*.entity{.ts,.js}'
  ],
  synchronize: false,
  logging: true,
});

async function bootstrap() {
  try {
    console.log('Connecting to database...');
    await dataSource.initialize();
    console.log('Database connection established.\n');

    // Run the seeds
    await runSeed(dataSource);
    
    console.log('\nSeeding completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Error during database seeding:', error);
    process.exit(1);
  } finally {
    if (dataSource.isInitialized) {
      await dataSource.destroy();
    }
  }
}

bootstrap();
