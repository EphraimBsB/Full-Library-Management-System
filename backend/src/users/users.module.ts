import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { User } from './entities/user.entity';
import { UserRole } from '../sys-configs/user-roles/entities/user-role.entity';
import { AuthModule } from '../auth/auth.module';
import { BooksModule } from 'src/books/books.module';
import { EmailModule } from 'src/emails/email.module';
import { NotificationsModule } from 'src/notifications/notifications.module';
import { UserRolesModule } from '../sys-configs/user-roles/user-roles.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, UserRole]),
    forwardRef(() => AuthModule),
    forwardRef(() => BooksModule),
    forwardRef(() => NotificationsModule),
    forwardRef(() => EmailModule),
    UserRolesModule,
  ],
  controllers: [UsersController],
  providers: [UsersService],
  exports: [UsersService, TypeOrmModule],
})
export class UsersModule {}
