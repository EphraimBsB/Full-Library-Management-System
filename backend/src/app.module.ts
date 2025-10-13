import { forwardRef, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { ServeStaticModule } from '@nestjs/serve-static'; // Add this import
import { join } from 'path';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { DatabaseModule } from './database/database.module';
import { NotificationsModule } from './notifications/notifications.module';
import { BooksModule } from './books/books.module';
import { EmailModule } from './emails/email.module';
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';
import { APP_GUARD } from '@nestjs/core';
import { JwtAuthGuard } from './auth/guards/jwt-auth.guard';
import { StorageModule } from './storage/storage.module';
import { MembershipModule } from './membership/membership.module';
import { CategoriesModule } from './sys-configs/categories/categories.module';
import { UserRolesModule } from './sys-configs/user-roles/user-roles.module';
import { DegreesModule } from './sys-configs/degrees/degrees.module';
import { MembershipTypesModule } from './sys-configs/membership-types/membership-types.module';
import { SourcesModule } from './sys-configs/sources/sources.module';
import { SubjectsModule } from './sys-configs/subjects/subjects.module';
import { TypesModule } from './sys-configs/types/types.module';
import { DashboardModule } from './dashboard/dashboard.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    ScheduleModule.forRoot(),
    DatabaseModule,
    NotificationsModule,
    BooksModule,
    EmailModule,
    forwardRef(() => UsersModule),
    forwardRef(() => AuthModule),
    forwardRef(() => MembershipModule),
    StorageModule,
    CategoriesModule,
    DegreesModule,
    SubjectsModule,
    TypesModule,
    SourcesModule,
    MembershipTypesModule,
    UserRolesModule,
    DashboardModule,
ServeStaticModule.forRoot({
      rootPath: join(process.cwd(), 'public'),
      serveRoot: '/uploads',
    }),
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
  ],
})
export class AppModule {}