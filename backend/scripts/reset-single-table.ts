import { DataSource } from 'typeorm';
import { dataSourceOptions } from '../src/database/data-source';

async function resetSingleTable(tableName: string) {
  if (!tableName) {
    console.error('Please provide a table name');
    console.log('Usage: npm run reset:table <table_name>');
    process.exit(1);
  }

  try {
    const dataSource = new DataSource(dataSourceOptions);
    await dataSource.initialize();
    
    console.log(`Resetting table: ${tableName}`);
    
    // Disable foreign key checks temporarily
    await dataSource.query('SET FOREIGN_KEY_CHECKS = 0');
    
    // Truncate the table (removes all data, keeps structure)
    await dataSource.query(`TRUNCATE TABLE ${tableName}`);
    
    // Re-enable foreign key checks
    await dataSource.query('SET FOREIGN_KEY_CHECKS = 1');
    
    console.log(`✅ Table '${tableName}' has been reset successfully`);
    
    await dataSource.destroy();
  } catch (error) {
    console.error(`❌ Error resetting table '${tableName}':`, error);
    process.exit(1);
  }
}

// Get table name from command line arguments
const tableName = process.argv[2];
resetSingleTable(tableName);
