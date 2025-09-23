import { MigrationInterface, QueryRunner, Table, TableForeignKey } from "typeorm";

export type BookRequestStatus = 'pending' | 'fulfilled' | 'cancelled';

export class CreateBookRequestsTable1758070884843 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.createTable(
            new Table({
                name: 'book_requests',
                columns: [
                    {
                        name: 'id',
                        type: 'int',
                        isPrimary: true,
                        isGenerated: true,
                        generationStrategy: 'increment',
                    },
                    {
                        name: 'bookId',
                        type: 'int',
                        isNullable: false,
                    },
                    {
                        name: 'userId',
                        type: 'varchar',
                        length: '36',
                        isNullable: false,
                    },
                    {
                        name: 'status',
                        type: 'varchar',
                        length: '20',
                        default: "'pending'",
                    },
                    {
                        name: 'fulfilledAt',
                        type: 'timestamp',
                        isNullable: true,
                    },
                    {
                        name: 'createdAt',
                        type: 'timestamp',
                        default: 'CURRENT_TIMESTAMP',
                    },
                    {
                        name: 'updatedAt',
                        type: 'timestamp',
                        default: 'CURRENT_TIMESTAMP',
                        onUpdate: 'CURRENT_TIMESTAMP',
                    },
                    {
                        name: 'deletedAt',
                        type: 'timestamp',
                        isNullable: true,
                    },
                ],
            }),
            true,
        );

        // Add foreign key for book
        await queryRunner.createForeignKey(
            'book_requests',
            new TableForeignKey({
                columnNames: ['bookId'],
                referencedColumnNames: ['id'],
                referencedTableName: 'books',
                onDelete: 'CASCADE',
            }),
        );

        // Add foreign key for user
        await queryRunner.createForeignKey(
            'book_requests',
            new TableForeignKey({
                columnNames: ['userId'],
                referencedColumnNames: ['id'],
                referencedTableName: 'users',
                onDelete: 'CASCADE',
            }),
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        const table = await queryRunner.getTable('book_requests');
        if (table) {
            const foreignKeys = table.foreignKeys;
            for (const fk of foreignKeys) {
                await queryRunner.dropForeignKey('book_requests', fk);
            }
            await queryRunner.dropTable('book_requests');
        }
    }
}
