import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddSoftDeleteColumns1700000000001 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Check if the column already exists in categories
    const categoriesHasColumn = await queryRunner.hasColumn('categories', 'deletedAt');
    if (!categoriesHasColumn) {
      await queryRunner.query(`
        ALTER TABLE categories 
        ADD COLUMN deletedAt TIMESTAMP NULL DEFAULT NULL
      `);
    }

    // Check if the column already exists in subjects
    const subjectsHasColumn = await queryRunner.hasColumn('subjects', 'deletedAt');
    if (!subjectsHasColumn) {
      await queryRunner.query(`
        ALTER TABLE subjects 
        ADD COLUMN deletedAt TIMESTAMP NULL DEFAULT NULL
      `);
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop the columns if they exist
    const categoriesHasColumn = await queryRunner.hasColumn('categories', 'deletedAt');
    if (categoriesHasColumn) {
      await queryRunner.query('ALTER TABLE categories DROP COLUMN deletedAt');
    }

    const subjectsHasColumn = await queryRunner.hasColumn('subjects', 'deletedAt');
    if (subjectsHasColumn) {
      await queryRunner.query('ALTER TABLE subjects DROP COLUMN deletedAt');
    }
  }
}
