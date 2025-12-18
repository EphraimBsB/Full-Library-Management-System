import { Module } from '@nestjs/common';
import { BooksModule } from '../books/books.module';
import { DataImportController } from './data-import.controller';
import { DataImportService } from './data-import.service';

@Module({
  imports: [BooksModule],
  controllers: [DataImportController],
  providers: [DataImportService],
})
export class DataImportModule {}
