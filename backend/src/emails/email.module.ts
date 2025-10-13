import { Module, forwardRef } from '@nestjs/common';
import { EmailService } from './email.service';
import { EmailUtilsService } from './email-utils.service';
import { EmailController } from './email.controller';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BookLoan } from '../books/entities/book-loan.entity';
import { BooksModule } from '../books/books.module';

@Module({
  imports: [
    ConfigModule,
    TypeOrmModule.forFeature([BookLoan]),
    forwardRef(() => BooksModule),
  ],
  controllers: [EmailController],
  providers: [EmailService, EmailUtilsService],
  exports: [EmailService, EmailUtilsService],
})
export class EmailModule {}
