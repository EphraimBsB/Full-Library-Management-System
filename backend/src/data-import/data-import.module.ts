import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { BooksModule } from '../books/books.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { DataImportController } from './data-import.controller';
import { DataImportService } from './data-import.service';
import { WorldCatService } from './worldcat.service';
import { JwtModule } from '@nestjs/jwt';

@Module({
  imports: [BooksModule, HttpModule, NotificationsModule, JwtModule],
  controllers: [DataImportController],
  providers: [DataImportService, WorldCatService],
})
export class DataImportModule {}
