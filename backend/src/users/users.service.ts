import { Injectable, NotFoundException, ConflictException, BadRequestException, Inject, forwardRef } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Not, IsNull, MoreThan, LessThanOrEqual } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User } from './entities/user.entity';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { PaginationOptions } from '../common/interfaces/pagination-options.interface';
import { PaginatedResponseDto } from '../common/dto/paginated-response.dto';
import { UserProfileSummaryDto } from './dto/user-profile.dto';
import { BookLoanService } from '../books/services/book-loan.service';
import { BookFavoriteService } from '../books/services/book-favorite.service';
import { BookNoteService } from '../books/services/book-note.service';
import { BookLoan, LoanStatus } from '../books/entities/book-loan.entity';
import { BookFavorite } from '../books/entities/book-favorite.entity';
import { BookNote } from '../books/entities/book-note.entity';

@Injectable()
export class UsersService {
  private readonly saltRounds = 10;

  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(BookLoan)
    private readonly bookLoanRepository: Repository<BookLoan>,
    @Inject(forwardRef(() => BookLoanService))
    private readonly bookLoanService: BookLoanService,
    @Inject(forwardRef(() => BookFavoriteService))
    private readonly bookFavoriteService: BookFavoriteService,
    @Inject(forwardRef(() => BookNoteService))
    private readonly bookNoteService: BookNoteService,
  ) { }

  private getSafePaginationOptions(options?: PaginationOptions): Required<PaginationOptions> {
    return {
      page: options?.page || 1,
      limit: options?.limit || 10,
      search: options?.search || '',
      sortBy: options?.sortBy || 'createdAt',
      sortOrder: options?.sortOrder || 'DESC'
    };
  }

  async getUserProfileSummary(userId: string): Promise<UserProfileSummaryDto> {
    const user = await this.userRepository.findOne({
      where: { id: userId, deletedAt: IsNull() },
      relations: ['memberships', 'role', 'memberships.type'],
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Get borrow stats
    const [userLoans, overdueLoans, returnedLoans] = await Promise.all([
      this.bookLoanService.getUserLoans(userId),
      this.bookLoanService.getOverdueLoans(),
      this.bookLoanRepository.find({
        where: {
          userId,
          status: LoanStatus.RETURNED,
          returnedAt: Not(IsNull())
        },
        select: ['id']
      })
    ]);

    // Get favorites and notes count
    const [favorites, notes] = await Promise.all([
      this.bookFavoriteService.getFavoritesCount(parseInt(userId, 10)),
      this.bookNoteService.getUserNotes(userId)
    ]);

    const activeBorrows = userLoans.filter(loan => loan.status === LoanStatus.ACTIVE).length;
    const overdueBorrows = overdueLoans.filter(loan => loan.userId === userId).length;
    const returnedBorrows = returnedLoans.length;
    const favoritesCount = typeof favorites === 'number' ? favorites : 0;
    const notesCount = Array.isArray(notes) ? notes.length : 0;

    // Handle case where user has no memberships
    const latestMembership = user.memberships && user.memberships.length > 0 ? user.memberships[0] : null;

    return {
      id: user.id,
      name: `${user.firstName} ${user.lastName}`.trim(),
      email: user.email,
      avatar: user.avatarUrl || null,
      rollNumber: user.rollNumber,
      phoneNumber: user.phoneNumber,
      program: user.degree,
      role: user.role.name,
      joinedAt: latestMembership?.startDate || user.createdAt,
      expiryDate: latestMembership?.expiryDate || null,
      membershipStatus: latestMembership?.status || 'inactive',
      membershipType: latestMembership?.type.name || 'None',
      stats: {
        borrow: {
          active: activeBorrows,
          overdue: overdueBorrows,
          returned: returnedBorrows,
        },
        favoritesCount,
        notesCount,
      },
    };
  }

  async getUserBorrowHistory(
    userId: string,
    options: PaginationOptions = {}
  ): Promise<PaginatedResponseDto<any>> {
    const safeOptions = this.getSafePaginationOptions(options);
    const [items, total] = await Promise.all([
      this.bookLoanService.getUserLoans(userId),
      this.bookLoanService.getUserLoans(userId).then(loans => loans.length)
    ]);

    const start = (safeOptions.page - 1) * safeOptions.limit;
    const end = start + safeOptions.limit;
    const paginatedItems = items.slice(start, end);

    const totalPages = Math.ceil(total / safeOptions.limit);
    return {
      data: paginatedItems,
      total,
      page: safeOptions.page,
      limit: safeOptions.limit,
      totalPages,
      hasPreviousPage: safeOptions.page > 1,
      hasNextPage: safeOptions.page < totalPages
    };
  }

  async getUserFavorites(
    userId: string,
    options: PaginationOptions = {}
  ): Promise<PaginatedResponseDto<any>> {
    const safeOptions = this.getSafePaginationOptions(options);
    const favorites = await this.bookFavoriteService.getUserFavorites(userId);
    const favoritesList = Array.isArray(favorites) ? favorites : [];

    const start = (safeOptions.page - 1) * safeOptions.limit;
    const end = start + safeOptions.limit;
    const paginatedItems = favoritesList.slice(start, end);

    const total = favoritesList.length;
    const totalPages = Math.ceil(total / safeOptions.limit);
    return {
      data: paginatedItems,
      total,
      page: safeOptions.page,
      limit: safeOptions.limit,
      totalPages,
      hasPreviousPage: safeOptions.page > 1,
      hasNextPage: safeOptions.page < totalPages
    };
  }

  async getUserNotes(
    userId: string,
    options: PaginationOptions = {}
  ): Promise<PaginatedResponseDto<any>> {
    const safeOptions = this.getSafePaginationOptions(options);
    const notes = await this.bookNoteService.getUserNotes(userId);
    const notesList = Array.isArray(notes) ? notes : [];

    const start = (safeOptions.page - 1) * safeOptions.limit;
    const end = start + safeOptions.limit;
    const paginatedItems = notesList.slice(start, end);

    const total = notesList.length;
    const totalPages = Math.ceil(total / safeOptions.limit);
    return {
      data: paginatedItems,
      total,
      page: safeOptions.page,
      limit: safeOptions.limit,
      totalPages,
      hasPreviousPage: safeOptions.page > 1,
      hasNextPage: safeOptions.page < totalPages
    };
  }

  private async hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, this.saltRounds);
  }

  async create(createUserDto: CreateUserDto): Promise<User> {
    // Check if email already exists
    const existingUser = await this.userRepository.findOne({
      where: { email: createUserDto.email, deletedAt: IsNull() },
    });

    if (existingUser) {
      throw new ConflictException('A user with this email already exists');
    }

    // Check if roll number already exists
    const existingRollNumber = await this.userRepository.findOne({
      where: { rollNumber: createUserDto.rollNumber, deletedAt: IsNull() },
    });

    if (existingRollNumber) {
      throw new ConflictException('A user with this roll number already exists');
    }

    const hashedPassword = await this.hashPassword(createUserDto.password);
    const { password, ...userData } = createUserDto;

    const user = this.userRepository.create({
      ...userData,
      passwordHash: hashedPassword,
    });

    return this.userRepository.save(user);
  }

  async findAll({
    page = 1,
    limit = 10,
    search,
  }: PaginationOptions): Promise<PaginatedResponseDto<User>> {
    const skip = (page - 1) * limit;
    const queryBuilder = this.userRepository
      .createQueryBuilder('user')
      .where('user.deletedAt IS NULL');

    if (search) {
      queryBuilder.andWhere(
        '(user.firstName LIKE :search OR user.lastName LIKE :search OR user.email LIKE :search OR user.rollNumber LIKE :search)',
        { search: `%${search}%` },
      );
    }

    const [data, total] = await queryBuilder
      .orderBy('user.createdAt', 'DESC')
      .skip(skip)
      .take(limit)
      .getManyAndCount();

    const totalPages = Math.ceil(total / limit);

    return new PaginatedResponseDto({
      data,
      total,
      page,
      limit,
      hasPreviousPage: page > 1,
      hasNextPage: page < totalPages,
    });
  }

  async findOne(id: string): Promise<User> {
    const user = await this.userRepository.findOne({
      where: {
        id,
        deletedAt: IsNull()
      },
      relations: ['role']
    });

    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    return user;
  }

  async remove(id: string): Promise<void> {
    const user = await this.findOne(id);
    await this.userRepository.softRemove(user);
  }

  async activateUser(userId: string): Promise<User> {
    const user = await this.findOne(userId);
    user.isActive = true;
    return this.userRepository.save(user);
  }

  async deactivateUser(userId: string): Promise<User> {
    const user = await this.findOne(userId);
    user.isActive = false;
    return this.userRepository.save(user);
  }

  async isUserActive(userId: string): Promise<boolean> {
    const user = await this.userRepository.findOne({
      where: {
        id: userId,
        isActive: true,
        deletedAt: IsNull()
      }
    });

    if (!user) {
      return false;
    }

    // Check if user has an active membership (if applicable)
    if (user.expiryDate) {
      return new Date(user.expiryDate) > new Date();
    }

    return true;
  }

  async update(id: string, updateUserDto: UpdateUserDto): Promise<User> {
    const user = await this.findOne(id);

    // Check if email is being updated and conflicts with existing users
    if (updateUserDto.email && updateUserDto.email !== user.email) {
      const existingUser = await this.userRepository.findOne({
        where: { email: updateUserDto.email, id: Not(id), deletedAt: IsNull() },
      });

      if (existingUser) {
        throw new ConflictException('A user with this email already exists');
      }
    }

    // Check if roll number is being updated and conflicts with existing users
    if (updateUserDto.rollNumber && updateUserDto.rollNumber !== user.rollNumber) {
      const existingRollNumber = await this.userRepository.findOne({
        where: { rollNumber: updateUserDto.rollNumber, id: Not(id), deletedAt: IsNull() },
      });

      if (existingRollNumber) {
        throw new ConflictException('A user with this roll number already exists');
      }
    }

    // Handle password update separately if needed
    if ('password' in updateUserDto && updateUserDto.password) {
      const hashedPassword = await this.hashPassword(updateUserDto.password);
      updateUserDto['passwordHash'] = hashedPassword;
      delete updateUserDto['password'];
    }

    Object.assign(user, updateUserDto);
    return this.userRepository.save(user);
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.userRepository.findOne({
      where: { email, deletedAt: IsNull() },
      relations: ['role']
    });
  }

  async validateUser(email: string, password: string): Promise<User | null> {
    const user = await this.findByEmail(email);
    if (!user) return null;

    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
    return isPasswordValid ? user : null;
  }
}
