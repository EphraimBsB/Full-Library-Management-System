import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { BooksModule } from '../books/books.module';
import { DataImportController } from './data-import.controller';
import { DataImportService } from './data-import.service';
import { WorldCatService } from './worldcat.service';

@Module({
  imports: [BooksModule, HttpModule],
  controllers: [DataImportController],
  providers: [DataImportService, WorldCatService],
})
export class DataImportModule {}
