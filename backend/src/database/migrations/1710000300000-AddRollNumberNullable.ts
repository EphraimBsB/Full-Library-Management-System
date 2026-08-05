import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddRollNumberNullable1710000300000 implements MigrationInterface {
  name = 'AddRollNumberNullable1710000300000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Check if roll_number column exists and is already nullable
    const rollNumberColumn = await queryRunner.hasColumn(
      'users',
      'roll_number',
    );

    if (rollNumberColumn) {
      await queryRunner.query(`
        ALTER TABLE users 
        ALTER COLUMN roll_number DROP NOT NULL
      `);
    }

    // Check if phone_number column exists and is already nullable
    const phoneNumberColumn = await queryRunner.hasColumn(
      'users',
      'phone_number',
    );

    if (phoneNumberColumn) {
      await queryRunner.query(`
        ALTER TABLE users 
        ALTER COLUMN phone_number DROP NOT NULL
      `);
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Make columns NOT NULL again
    await queryRunner.query(`
      ALTER TABLE users 
        ALTER COLUMN roll_number SET NOT NULL
    `);

    await queryRunner.query(`
      ALTER TABLE users 
        ALTER COLUMN phone_number SET NOT NULL
    `);
  }
}
