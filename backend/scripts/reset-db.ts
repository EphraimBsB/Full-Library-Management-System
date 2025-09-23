import 'reflect-metadata';
import { createConnection } from 'mysql2/promise';
import { config } from 'dotenv';

async function resetDatabase() {
  // Load environment variables
  config();

  // Create a connection without specifying the database
  const connection = await createConnection({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '3306', 10),
    user: process.env.DB_USERNAME || 'root',
    password: process.env.DB_PASSWORD || '',
  });

  try {
    const dbName = process.env.DB_DATABASE || 'library_db';
    
    // Drop the database if it exists
    await connection.query(`DROP DATABASE IF EXISTS \`${dbName}\``);
    console.log(`Dropped database: ${dbName}`);
    
    // Create a new database
    await connection.query(`CREATE DATABASE \`${dbName}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`);
    console.log(`Created database: ${dbName}`);
    
    console.log('Database reset successful!');
  } catch (error) {
    console.error('Error resetting database:', error);
    process.exit(1);
  } finally {
    await connection.end();
    process.exit(0);
  }
}

resetDatabase();
