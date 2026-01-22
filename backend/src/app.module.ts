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
import { DataImportModule } from './data-import/data-import.module';
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
import { PublishersModule } from './sys-configs/publishers/publishers.module';
import { LocationsModule } from './sys-configs/locations/locations.module';
import { ShelvesModule } from './sys-configs/shelves/shelves.module';
import { DashboardModule } from './dashboard/dashboard.module';
import { StudentsModule } from './auth/students/students.module';

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
    PublishersModule,
    LocationsModule,
    ShelvesModule,
    MembershipTypesModule,
    UserRolesModule,
    DashboardModule,
    ServeStaticModule.forRoot({
      rootPath: join(process.cwd(), 'public'),
      serveRoot: '/uploads',
    }),
    // Data import module for uploading book Excel files
    DataImportModule,
    StudentsModule,
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
export class AppModule { }