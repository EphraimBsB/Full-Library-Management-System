import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Notification } from './entities/notification.entity';
import { UsersModule } from '../users/users.module';
import { AuthModule } from '../auth/auth.module';
import { ConfigModule } from '@nestjs/config';
import { User } from '../users/entities/user.entity';
import { NotificationsScheduler } from './notifications.scheduler';
import { NotificationsController } from './notifications.controller';
import { NotificationsGateway } from './notifications.gateway';
import { NotificationsService } from './notifications.service';
import { BookLoan } from 'src/books/entities/book-loan.entity';
import { BookRequest } from 'src/books/entities/book-request.entity';
import { QueueEntry } from 'src/books/entities/queue-entry.entity';
import { EmailModule } from 'src/emails/email.module';

@Module({
  imports: [
    ConfigModule,
    TypeOrmModule.forFeature([Notification, User, BookLoan, BookRequest, QueueEntry]),
    // Forward ref if you need to inject notifications into users or vice versa
    forwardRef(() => UsersModule),
    forwardRef(() => AuthModule),
    EmailModule,
  ],
  providers: [NotificationsService, NotificationsGateway, NotificationsScheduler],
  controllers: [NotificationsController],
  exports: [NotificationsService],
})
export class NotificationsModule {}
