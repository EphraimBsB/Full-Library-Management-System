import { Module, forwardRef } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { User } from './entities/user.entity';
import { UserRole } from '../sys-configs/user-roles/entities/user-role.entity';
import { BookLoan } from '../books/entities/book-loan.entity';
import { BookRequest } from '../books/entities/book-request.entity';
import { AuthModule } from '../auth/auth.module';
import { BooksModule } from 'src/books/books.module';
import { EmailModule } from 'src/emails/email.module';
import { NotificationsModule } from 'src/notifications/notifications.module';
import { UserRolesModule } from '../sys-configs/user-roles/user-roles.module';
import { BookFavoriteService } from 'src/books/services/book-favorite.service';
import { BookLoanService } from 'src/books/services/book-loan.service';
import { BookNoteService } from 'src/books/services/book-note.service';
import { BookRequestService } from 'src/books/services/book-request.service';
import { MembershipService } from 'src/membership/membership.service';
import loanConfig from 'src/books/config/loan.config';
import { BookFavorite } from 'src/books/entities/book-favorite.entity';
import { BookNote } from 'src/books/entities/book-note.entity';
import { Book } from 'src/books/entities/book.entity';
import { Membership } from 'src/membership/entities/membership.entity';
import { QueueEntry } from 'src/books/entities/queue-entry.entity';
import { BookCopy } from 'src/books/entities/book-copy.entity';
import { MembershipType } from 'src/sys-configs/membership-types/entities/membership-type.entity';

@Module({
  imports: [
    ConfigModule,
    ConfigModule.forFeature(loanConfig),
    TypeOrmModule.forFeature([
      User,
      UserRole,
      BookLoan,
      BookRequest,
      BookFavorite,
      BookNote,
      Book,
      Membership,
      QueueEntry,
      BookCopy,
      MembershipType,
    ]),
    forwardRef(() => AuthModule),
    forwardRef(() => BooksModule),
    forwardRef(() => NotificationsModule),
    forwardRef(() => EmailModule),
    UserRolesModule,
  ],
  controllers: [UsersController],
  providers: [
    UsersService,
    BookLoanService,
    BookFavoriteService,
    BookNoteService,
    BookRequestService,
    MembershipService,
  ],
  exports: [UsersService, TypeOrmModule],
})
export class UsersModule { }
