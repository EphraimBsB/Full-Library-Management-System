import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { AuthModule } from '../auth/auth.module';

// Entities
import { Book } from './entities/book.entity';
import { Category } from './entities/category.entity';
import { Subject } from './entities/subject.entity';
import { AccessNumber } from './entities/access-number.entity';
import { BorrowedBook } from './entities/borrowed-book.entity';
import { BookRequest } from './entities/book-request.entity';
import { User } from '../users/entities/user.entity';

// Controllers
import { BooksController } from './books.controller';
import { CategoryController } from './controllers/category.controller';
import { SubjectController } from './controllers/subject.controller';
import { BookBorrowingController } from './controllers/book-borrowing.controller';
import { BookRequestController } from './controllers/book-request.controller';

// Services
import { BooksService } from './books.service';
import { CategoryService } from './services/category.service';
import { SubjectService } from './services/subject.service';
import { BookBorrowingService } from './services/book-borrowing.service';
import { BookRequestService } from './services/book-request.service';

import { UsersModule } from '../users/users.module';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Book,
      Category,
      Subject,
      AccessNumber,
      BorrowedBook,
      BookRequest,
      User,
    ]),
    ConfigModule,
    forwardRef(() => UsersModule),
    forwardRef(() => AuthModule),
    forwardRef(() => NotificationsModule),
  ],
  controllers: [
    BooksController,
    CategoryController,
    SubjectController,
    BookBorrowingController,
    BookRequestController,
  ],
  providers: [
    BooksService,
    CategoryService,
    SubjectService,
    BookBorrowingService,
    BookRequestService,
  ],
  exports: [
    BooksService,
    CategoryService,
    SubjectService,
    BookBorrowingService,
    BookRequestService,
    TypeOrmModule,
  ],
})
export class BooksModule {}
