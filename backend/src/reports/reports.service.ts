import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, Like } from 'typeorm';
import * as XLSX from 'xlsx';
import { Book } from '../books/entities/book.entity';
import { BookLoan } from '../books/entities/book-loan.entity';
import { User } from '../users/entities/user.entity';
import { BookRequest } from 'src/books/entities/book-request.entity';
import { ExportQueryDto, ExportFormat } from './dto/export-query.dto';
import { Category } from '../sys-configs/categories/entities/category.entity';
import { Subject } from '../sys-configs/subjects/entities/subject.entity';
import { Publisher } from '../sys-configs/publishers/entities/publisher.entity';

@Injectable()
export class ReportsService {
  constructor(
    @InjectRepository(Book)
    private readonly bookRepository: Repository<Book>,
    @InjectRepository(BookLoan)
    private readonly loanRepository: Repository<BookLoan>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(BookRequest)
    private readonly requestRepository: Repository<BookRequest>,
    @InjectRepository(Category)
    private readonly categoryRepository: Repository<Category>,
    @InjectRepository(Subject)
    private readonly subjectRepository: Repository<Subject>,
    @InjectRepository(Publisher)
    private readonly publisherRepository: Repository<Publisher>,
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

  async exportRequestsToExcel(): Promise<Buffer> {
    const requests = await this.requestRepository.find({
      relations: ['user', 'book', 'book.type', 'book.categories'],
    });

    const data = requests.map(request => ({
      'Request ID': request.id,
      'User Name': `${request.user?.firstName || ''} ${request.user?.lastName || ''}`.trim(),
      'Roll Number': request.user?.rollNumber || 'N/A',
      'Book Title': request.book?.title || 'Unknown',
      'Author': request.book?.author || 'N/A',
      'ISBN': request.book?.isbn || 'N/A',
      'Request Type': request.requestType || 'N/A',
      'Status': request.status || 'N/A',
      'Requested At': request.createdAt ? new Date(request.createdAt).toLocaleDateString() : 'N/A',
      'Approved At': request.approvedAt ? new Date(request.approvedAt).toLocaleDateString() : 'N/A',
      'Reason': request.reason || 'N/A',
    }));

    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Book Requests');

    return XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
  }

  async exportBooks(query: ExportQueryDto): Promise<Buffer> {
    const whereCondition: any = {};
    
    if (query.startDate || query.endDate) {
      whereCondition.createdAt = Between(
        query.startDate ? new Date(query.startDate) : new Date('1900-01-01'),
        query.endDate ? new Date(query.endDate) : new Date()
      );
    }

    if (query.search) {
      whereCondition.title = Like(`%${query.search}%`);
    }

    const books = await this.bookRepository.find({
      where: whereCondition,
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

    return this.createExportBuffer(data, 'Books', query.format || ExportFormat.EXCEL);
  }

  async exportUsers(query: ExportQueryDto): Promise<Buffer> {
    const whereCondition: any = {};
    
    if (query.startDate || query.endDate) {
      whereCondition.createdAt = Between(
        query.startDate ? new Date(query.startDate) : new Date('1900-01-01'),
        query.endDate ? new Date(query.endDate) : new Date()
      );
    }

    if (query.search) {
      whereCondition.firstName = Like(`%${query.search}%`);
    }

    const users = await this.userRepository.find({
      where: whereCondition,
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

    return this.createExportBuffer(data, 'Users', query.format || ExportFormat.EXCEL);
  }

  async exportLoans(query: ExportQueryDto): Promise<Buffer> {
    const whereCondition: any = {};
    
    if (query.startDate || query.endDate) {
      whereCondition.borrowedAt = Between(
        query.startDate ? new Date(query.startDate) : new Date('1900-01-01'),
        query.endDate ? new Date(query.endDate) : new Date()
      );
    }

    const loans = await this.loanRepository.find({
      where: whereCondition,
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

    return this.createExportBuffer(data, 'Loans', query.format || ExportFormat.EXCEL);
  }

  async exportCategories(query: ExportQueryDto): Promise<Buffer> {
    const categories = await this.categoryRepository.find({
      order: { name: 'ASC' }
    });

    const data = categories.map(category => ({
      ID: category.id,
      Name: category.name,
      Description: category.description || 'N/A',
      'Is Active': category.isActive ? 'Active' : 'Inactive',
    }));

    return this.createExportBuffer(data, 'Categories', query.format || ExportFormat.EXCEL);
  }

  async exportSubjects(query: ExportQueryDto): Promise<Buffer> {
    const subjects = await this.subjectRepository.find({
      order: { name: 'ASC' }
    });

    const data = subjects.map(subject => ({
      ID: subject.id,
      Name: subject.name,
      Description: subject.description || 'N/A',
      'Is Active': subject.isActive ? 'Active' : 'Inactive',
    }));

    return this.createExportBuffer(data, 'Subjects', query.format || ExportFormat.EXCEL);
  }

  async exportPublishers(query: ExportQueryDto): Promise<Buffer> {
    const publishers = await this.publisherRepository.find({
      order: { name: 'ASC' }
    });

    const data = publishers.map(publisher => ({
      ID: publisher.id,
      Name: publisher.name,
      Description: publisher.description || 'N/A',
      'Is Active': publisher.isActive ? 'Active' : 'Inactive',
    }));

    return this.createExportBuffer(data, 'Publishers', query.format || ExportFormat.EXCEL);
  }

  private createExportBuffer(data: any[], sheetName: string, format: ExportFormat): Buffer {
    if (format === ExportFormat.JSON) {
      return Buffer.from(JSON.stringify(data, null, 2), 'utf-8');
    }

    if (format === ExportFormat.CSV) {
      const worksheet = XLSX.utils.json_to_sheet(data);
      const csv = XLSX.utils.sheet_to_csv(worksheet);
      return Buffer.from(csv, 'utf-8');
    }

    // Default to Excel format
    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
    return XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
  }
}
