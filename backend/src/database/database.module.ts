import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { Book } from '../books/entities/book.entity';
import { Category } from 'src/sys-configs/categories/entities/category.entity';
import { Subject } from 'src/sys-configs/subjects/entities/subject.entity';
import { User } from 'src/users/entities/user.entity';
import { Notification } from '../notifications/entities/notification.entity';
import { BookCopy } from 'src/books/entities/book-copy.entity';
import { BookLoan } from 'src/books/entities/book-loan.entity';
import { BookRequest } from 'src/books/entities/book-request.entity';
import { QueueEntry } from 'src/books/entities/queue-entry.entity';
import { FileRecord } from 'src/storage/entities/file-record.entity';
import { Membership } from 'src/membership/entities/membership.entity';
import { MembershipRequest } from 'src/membership/entities/membership-request.entity';
import { MembershipType } from 'src/sys-configs/membership-types/entities/membership-type.entity';
import { Source } from 'src/sys-configs/sources/entities/source.entity';
import { Type } from 'src/sys-configs/types/entities/type.entity';
import { Degree } from 'src/sys-configs/degrees/entities/degree.entity';
import { UserRole } from 'src/sys-configs/user-roles/entities/user-role.entity';
import { BookMetadata } from 'src/books/entities/book-metadata.entity';
import { LoanSettings } from 'src/sys-configs/loan-settings/loan-settings.entity';
@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        type: 'mysql',
        host: configService.get('DB_HOST', 'localhost'),
        username: configService.get('DB_USERNAME', 'root'),
        password: configService.get('DB_PASSWORD', ''),
        database: configService.get('DB_DATABASE', 'library_db'),
        entities: [
          User,
          Book,
          BookCopy,
          Category,
          Subject,
          BookRequest,
          BookLoan,
          QueueEntry,
          Notification,
          FileRecord,
          Membership,
          MembershipRequest,
          MembershipType,
          Source,
          Type,
          Degree,
          UserRole,
          BookMetadata,
          LoanSettings,
        ],
        synchronize: configService.get('NODE_ENV') === 'development',
        // logging: configService.get('NODE_ENV') === 'development',
        dropSchema: false,
        migrationsRun: true,
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
