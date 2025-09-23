import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Notification } from './entities/notification.entity';
import { UsersModule } from '../users/users.module';
import { AuthModule } from '../auth/auth.module';
import { ConfigModule } from '@nestjs/config';
import { User } from '../users/entities/user.entity';
import { EmailService } from './email.service';
import { NotificationsScheduler } from './notifications.scheduler';
import { BorrowedBook } from '../books/entities/borrowed-book.entity';
import { NotificationsController } from './notifications.controller';
import { NotificationsGateway } from './notifications.gateway';
import { NotificationsService } from './notifications.service';

@Module({
  imports: [
    ConfigModule,
    TypeOrmModule.forFeature([Notification, User, BorrowedBook]),
    // Forward ref if you need to inject notifications into users or vice versa
    forwardRef(() => UsersModule),
    forwardRef(() => AuthModule),
  ],
  providers: [NotificationsService, NotificationsGateway, EmailService, NotificationsScheduler],
  controllers: [NotificationsController],
  exports: [NotificationsService, EmailService],
})
export class NotificationsModule {}
