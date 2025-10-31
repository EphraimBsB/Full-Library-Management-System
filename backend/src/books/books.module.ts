import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { CacheModule } from '@nestjs/cache-manager';
import { BullModule } from '@nestjs/bull';
import loanConfig from './config/loan.config';
import { AuthModule } from '../auth/auth.module';

// Entities
import { Book } from './entities/book.entity';
import { Subject } from '../sys-configs/subjects/entities/subject.entity';
import { User } from '../users/entities/user.entity';

// Controllers
import { BooksController } from './books.controller';

// Services
import { BooksService } from './books.service';

import { UsersModule } from '../users/users.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { BookCopy } from './entities/book-copy.entity';
import { BookRequest } from './entities/book-request.entity';
import { BookLoan } from './entities/book-loan.entity';
import { QueueEntry } from './entities/queue-entry.entity';
import { BookLoanController } from './controllers/book-loan.controller';
import { BookRequestController } from './controllers/book-request.controller';
import { QueueController } from './controllers/queue.controller';
import { BookLoanService } from './services/book-loan.service';
import { BookRequestService } from './services/book-request.service';
import { QueueService } from './services/queue.service';
import { EmailModule } from 'src/emails/email.module';
import { MembershipModule } from '../membership/membership.module';
import { Category } from 'src/sys-configs/categories/entities/category.entity';
import { Type } from 'src/sys-configs/types/entities/type.entity';
import { Source } from 'src/sys-configs/sources/entities/source.entity';
import { TypesModule } from 'src/sys-configs/types/types.module';
import { SourcesModule } from 'src/sys-configs/sources/sources.module';
import { LoanSettingsModule } from 'src/sys-configs/loan-settings/loan-settings.module';
import { BookFavorite } from './entities/book-favorite.entity';
import { BookNote } from './entities/book-note.entity';
import { BookInhouseUsage } from './entities/book-inhouse-usage.entity';
import { BookFavoriteController } from './controllers/book-favorite.controller';
import { BookNoteController } from './controllers/book-note.controller';
import { InhouseUsageController } from './controllers/inhouse-usage.controller';
import { BookFavoriteService } from './services/book-favorite.service';
import { BookNoteService } from './services/book-note.service';
import { InhouseUsageService } from './services/inhouse-usage.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Book,
      Category,
      Subject,
      Type,
      Source,
      BookCopy,
      BookRequest,
      BookLoan,
      BookFavorite,
      BookNote,
      BookInhouseUsage,
      QueueEntry,
      User,
    ]),
    TypesModule,
    SourcesModule,
    ConfigModule.forFeature(loanConfig),
    CacheModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        ttl: configService.get<number>('loan.cacheTtl', 300),
      }),
      inject: [ConfigService],
      isGlobal: true,
    }),
    BullModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        redis: {
          host: configService.get<string>('REDIS_HOST', 'localhost'),
          port: configService.get<number>('REDIS_PORT', 6379),
        },
      }),
      inject: [ConfigService],
    }),
    BullModule.registerQueue({ name: 'book-loan' }),
    forwardRef(() => UsersModule),
    forwardRef(() => AuthModule),
    forwardRef(() => NotificationsModule),
    forwardRef(() => EmailModule),
    forwardRef(() => MembershipModule),
    LoanSettingsModule,
  ],
  controllers: [
    BooksController,
    BookLoanController,
    BookRequestController,
    QueueController,
    BookFavoriteController,
    BookNoteController,
    InhouseUsageController,
  ],
  providers: [
    BooksService,
    BookLoanService,
    BookRequestService,
    QueueService,
    BookFavoriteService,
    BookNoteService,
    InhouseUsageService,
  ],
  exports: [
    BooksService,
    BookLoanService,
    BookRequestService,
    QueueService,
    BookFavoriteService,
    BookNoteService,
    InhouseUsageService,
  ],
})
export class BooksModule {}
