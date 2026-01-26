import { DataSource } from 'typeorm';
import { dataSourceOptions } from '../src/database/data-source';

async function resetAutoIncrement(tableName: string) {
  if (!tableName) {
    console.error('Please provide a table name');
    console.log('Usage: npm run reset:id <table_name>');
    process.exit(1);
  }

  try {
    const dataSource = new DataSource(dataSourceOptions);
    await dataSource.initialize();
    
    console.log(`Resetting auto-increment for table: ${tableName}`);
    
    // Get the current auto-increment value
    const result = await dataSource.query(`
      SELECT AUTO_INCREMENT 
      FROM INFORMATION_SCHEMA.TABLES 
      WHERE TABLE_SCHEMA = DATABASE() 
      AND TABLE_NAME = '${tableName}'
    `);
    
    const currentValue = result[0]?.AUTO_INCREMENT || 1;
    console.log(`Current auto-increment value: ${currentValue}`);
    
    // Reset auto-increment to 1
    await dataSource.query(`ALTER TABLE ${tableName} AUTO_INCREMENT = 1`);
    
    console.log(`✅ Auto-increment for table '${tableName}' has been reset to 1`);
    
    await dataSource.destroy();
  } catch (error) {
    console.error(`❌ Error resetting auto-increment for table '${tableName}':`, error);
    process.exit(1);
  }
}

// Get table name from command line arguments
const tableName = process.argv[2];
resetAutoIncrement(tableName);
