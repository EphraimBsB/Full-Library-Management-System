import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { Book } from '../books/entities/book.entity';
import { Category } from '../books/entities/category.entity';
import { Subject } from '../books/entities/subject.entity';
import { AccessNumber } from '../books/entities/access-number.entity';
import { User } from 'src/users/entities/user.entity';
import { BorrowedBook } from 'src/books/entities/borrowed-book.entity';
import { Notification } from '../notifications/entities/notification.entity';
import { BookRequest } from 'src/books/entities/book-request.entity';

@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        type: 'mysql',
        host: configService.get('DB_HOST', 'localhost'),
        port: configService.get<number>('DB_PORT', 3306),
        username: configService.get('DB_USERNAME', 'root'),
        password: configService.get('DB_PASSWORD', ''),
        database: configService.get('DB_DATABASE', 'library_db'),
        entities: [
          User,
          Book,
          Category,
          Subject,
          AccessNumber,
          BorrowedBook,
          BookRequest,
          Notification,
        ],
        synchronize: configService.get('NODE_ENV') === 'development',
        // logging: configService.get('NODE_ENV') === 'development',
        dropSchema: false,
        migrationsRun: true,
        migrations: ['dist/migrations/*{.ts,.js}'],
        migrationsTableName: 'migrations',
        cli: {
          migrationsDir: 'src/migrations',
        },
      }),
    }),
  ],
  exports: [TypeOrmModule],
})
export class DatabaseModule {}
