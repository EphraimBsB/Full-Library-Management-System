import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ReportsService } from './reports.service';
import { ReportsController } from './reports.controller';
import { Book } from '../books/entities/book.entity';
import { BookLoan } from '../books/entities/book-loan.entity';
import { User } from '../users/entities/user.entity';
import { BookRequest } from '../books/entities/book-request.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Book, BookLoan, User, BookRequest]),
  ],
  providers: [ReportsService],
  controllers: [ReportsController],
})
export class ReportsModule {}
