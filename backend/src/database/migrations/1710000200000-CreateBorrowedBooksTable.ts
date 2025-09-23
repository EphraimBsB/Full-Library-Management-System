import { MigrationInterface, QueryRunner, Table, TableForeignKey, TableIndex } from 'typeorm';

export class CreateBorrowedBooksTable1710000200000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'borrowed_books',
        columns: [
          {
            name: 'id',
            type: 'int',
            isPrimary: true,
            isGenerated: true,
            generationStrategy: 'increment',
          },
          {
            name: 'user_id',
            type: 'varchar',
            length: '36',
            isNullable: false,
          },
          {
            name: 'book_id',
            type: 'int',
            isNullable: false,
          },
          {
            name: 'borrowed_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
          {
            name: 'due_date',
            type: 'timestamp',
            isNullable: false,
          },
          {
            name: 'returned_at',
            type: 'timestamp',
            isNullable: true,
          },
          {
            name: 'fine_amount',
            type: 'decimal',
            precision: 10,
            scale: 2,
            default: 0,
          },
          {
            name: 'is_returned',
            type: 'boolean',
            default: false,
          },
          {
            name: 'created_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
          {
            name: 'updated_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
            onUpdate: 'CURRENT_TIMESTAMP',
          },
        ],
      }),
      true,
    );

    // Create foreign key for user_id
    await queryRunner.createForeignKey(
      'borrowed_books',
      new TableForeignKey({
        columnNames: ['user_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'users',
        onDelete: 'CASCADE',
        name: 'FK_borrowed_books_user',
      }),
    );

    // Create foreign key for book_id
    await queryRunner.createForeignKey(
      'borrowed_books',
      new TableForeignKey({
        columnNames: ['book_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'books',
        onDelete: 'CASCADE',
        name: 'FK_borrowed_books_book',
      }),
    );

    // Create index for user_id and book_id
    await queryRunner.createIndex(
      'borrowed_books',
      new TableIndex({
        name: 'IDX_BORROWED_BOOKS_USER',
        columnNames: ['user_id'],
      }),
    );

    await queryRunner.createIndex(
      'borrowed_books',
      new TableIndex({
        name: 'IDX_BORROWED_BOOKS_BOOK',
        columnNames: ['book_id'],
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('borrowed_books');
  }
}
