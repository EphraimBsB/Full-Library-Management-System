import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ReportsService } from './reports.service';
import { ReportsController } from './reports.controller';
import { Book } from '../books/entities/book.entity';
import { BookLoan } from '../books/entities/book-loan.entity';
import { User } from '../users/entities/user.entity';
import { BookRequest } from '../books/entities/book-request.entity';
import { Category } from '../sys-configs/categories/entities/category.entity';
import { Subject } from '../sys-configs/subjects/entities/subject.entity';
import { Publisher } from '../sys-configs/publishers/entities/publisher.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Book, BookLoan, User, BookRequest, Category, Subject, Publisher]),
  ],
  providers: [ReportsService],
  controllers: [ReportsController],
})
export class ReportsModule {}
