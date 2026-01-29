import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as XLSX from 'xlsx';
import { Book } from '../books/entities/book.entity';
import { BookLoan } from '../books/entities/book-loan.entity';
import { User } from '../users/entities/user.entity';

@Injectable()
export class ReportsService {
  constructor(
    @InjectRepository(Book)
    private readonly bookRepository: Repository<Book>,
    @InjectRepository(BookLoan)
    private readonly loanRepository: Repository<BookLoan>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async exportBooksToExcel(): Promise<Buffer> {
    const books = await this.bookRepository.find({
      relations: ['type', 'source', 'categories'],
    });

    const data = books.map(book => ({
      ID: book.id,
      Title: book.title,
      Author: book.author,
      ISBN: book.isbn || 'N/A',
      Publisher: book.publisher || 'N/A',
      Year: book.publicationYear || 'N/A',
      Type: book.type?.name || 'N/A',
      Source: book.source?.supplier || 'N/A',
      'Total Copies': book.totalCopies,
      'Available Copies': book.availableCopies,
      Categories: book.categories?.map(c => c.name).join(', ') || 'N/A',
    }));

    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Books');

    return XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
  }

  async exportLoansToExcel(): Promise<Buffer> {
    const loans = await this.loanRepository.find({
      relations: ['user', 'bookCopy', 'bookCopy.book'],
    });

    const data = loans.map(loan => ({
      'Loan ID': loan.id,
      'User Name': `${loan.user?.firstName || ''} ${loan.user?.lastName || ''}`.trim(),
      'Roll Number': loan.user?.rollNumber || 'N/A',
      'Book Title': loan.bookCopy?.book?.title || 'Unknown',
      'Access Number': loan.bookCopy?.accessNumber || 'N/A',
      'Borrowed At': loan.borrowedAt ? new Date(loan.borrowedAt).toLocaleDateString() : 'N/A',
      'Due Date': loan.dueDate ? new Date(loan.dueDate).toLocaleDateString() : 'N/A',
      'Returned At': loan.returnedAt ? new Date(loan.returnedAt).toLocaleDateString() : 'Active',
      Status: loan.status,
    }));

    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Loans');

    return XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
  }

  async exportUsersToExcel(): Promise<Buffer> {
    const users = await this.userRepository.find({
      relations: ['role'],
    });

    const data = users.map(user => ({
      ID: user.id,
      Name: `${user.firstName} ${user.lastName}`,
      Email: user.email,
      'Roll Number': user.rollNumber,
      Role: user.role?.name || 'N/A',
      Degree: user.degree || 'N/A',
      'Join Date': user.joinDate ? new Date(user.joinDate).toLocaleDateString() : 'N/A',
      Status: user.isActive ? 'Active' : 'Inactive',
    }));

    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Users');

    return XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
  }
}
