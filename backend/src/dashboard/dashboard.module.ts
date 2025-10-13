import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CacheModule } from '@nestjs/cache-manager';
import { DashboardService } from './dashboard.service';
import { DashboardController } from './dashboard.controller';
import { Book } from '../books/entities/book.entity';
import { User } from '../users/entities/user.entity';
import { BookRequest } from '../books/entities/book-request.entity';
import { BookLoan } from '../books/entities/book-loan.entity';

@Module({
  imports: [
    CacheModule.register(),
    TypeOrmModule.forFeature([
      Book,
      User,
      BookRequest,
      BookLoan,
    ]),
  ],
  controllers: [DashboardController],
  providers: [DashboardService],
  exports: [DashboardService],
})
export class DashboardModule {}
