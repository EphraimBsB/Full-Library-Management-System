import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
  Inject,
  forwardRef,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Not, IsNull, MoreThan, LessThanOrEqual } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User } from './entities/user.entity';
import { CreateUserDto } from './dto/create-user.dto';
import { CreateMemberDto } from './dto/create-member.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { PaginationOptions } from '../common/interfaces/pagination-options.interface';
import { PaginatedResponseDto } from '../common/dto/paginated-response.dto';
import { UserProfileSummaryDto } from './dto/user-profile.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { BookLoanService } from '../books/services/book-loan.service';
import { BookFavoriteService } from '../books/services/book-favorite.service';
import { BookNoteService } from '../books/services/book-note.service';
import { BookLoan, LoanStatus } from '../books/entities/book-loan.entity';
import { BookFavorite } from '../books/entities/book-favorite.entity';
import { BookNote } from '../books/entities/book-note.entity';
import { MembershipService, MembershipStatus } from '../membership/membership.service';
import { MembershipType } from '../sys-configs/membership-types/entities/membership-type.entity';

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
    @Inject(forwardRef(() => MembershipService))
    private readonly membershipService: MembershipService,
  ) {}

  private getSafePaginationOptions(
    options?: PaginationOptions,
  ): Required<PaginationOptions> {
    return {
      page: options?.page || 1,
      limit: options?.limit || 10,
      search: options?.search || '',
      sortBy: options?.sortBy || 'createdAt',
      sortOrder: options?.sortOrder || 'DESC',
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
      this.bookLoanService.getOverdueLoans(userId),
      this.bookLoanRepository.find({
        where: {
          userId,
          status: LoanStatus.RETURNED,
          returnedAt: Not(IsNull()),
        },
        select: ['id'],
      }),
    ]);

    // Get favorites and notes count
    const [favorites, notes] = await Promise.all([
      this.bookFavoriteService.getUserFavoritesCount(userId),
      this.bookNoteService.getUserNotes(userId),
    ]);

    const activeBorrows = userLoans.filter(
      (loan) => loan.status === LoanStatus.ACTIVE,
    ).length;
    const overdueBorrows = overdueLoans.length;
    const returnedBorrows = returnedLoans.length;
    const favoritesCount = typeof favorites === 'number' ? favorites : 0;
    const notesCount = Array.isArray(notes) ? notes.length : 0;

    // Handle case where user has no memberships
    const latestMembership =
      user.memberships && user.memberships.length > 0
        ? user.memberships[0]
        : null;

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
    options: PaginationOptions = {},
  ): Promise<PaginatedResponseDto<any>> {
    const safeOptions = this.getSafePaginationOptions(options);
    const [items, total] = await this.bookLoanService.getUserLoansPaginated(
      userId,
      safeOptions,
    );

    const totalPages = Math.ceil(total / safeOptions.limit);
    return {
      data: items,
      total,
      page: safeOptions.page,
      limit: safeOptions.limit,
      totalPages,
      hasPreviousPage: safeOptions.page > 1,
      hasNextPage: safeOptions.page < totalPages,
    };
  }

  async getUserFavorites(
    userId: string,
    options: PaginationOptions = {},
  ): Promise<PaginatedResponseDto<any>> {
    const safeOptions = this.getSafePaginationOptions(options);
    const [favoritesList, total] =
      await this.bookFavoriteService.getUserFavoritesPaginated(
        userId,
        safeOptions,
      );
    const totalPages = Math.ceil(total / safeOptions.limit);
    return {
      data: favoritesList,
      total,
      page: safeOptions.page,
      limit: safeOptions.limit,
      totalPages,
      hasPreviousPage: safeOptions.page > 1,
      hasNextPage: safeOptions.page < totalPages,
    };
  }

  async getUserNotes(
    userId: string,
    options: PaginationOptions = {},
  ): Promise<PaginatedResponseDto<any>> {
    const safeOptions = this.getSafePaginationOptions(options);
    const [notesList, total] = await this.bookNoteService.getUserNotesPaginated(
      userId,
      safeOptions,
    );
    const totalPages = Math.ceil(total / safeOptions.limit);
    return {
      data: notesList,
      total,
      page: safeOptions.page,
      limit: safeOptions.limit,
      totalPages,
      hasPreviousPage: safeOptions.page > 1,
      hasNextPage: safeOptions.page < totalPages,
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
      throw new ConflictException(
        'A user with this roll number already exists',
      );
    }

    const hashedPassword = await this.hashPassword(createUserDto.password);
    const { password, ...userData } = createUserDto;

    const user = this.userRepository.create({
      ...userData,
      passwordHash: hashedPassword,
    });

    return this.userRepository.save(user);
  }

  private async generateRollNumber(): Promise<string> {
    const prefix = 'LM';
    const year = new Date().getFullYear().toString().slice(-2); // Last 2 digits of current year
    const randomDigits = Math.floor(1000 + Math.random() * 9000).toString(); // 4-digit random number
    return `${prefix}${year}${randomDigits}`;
  }

  async createMember(createMemberDto: CreateMemberDto): Promise<User> {
    // Check if email already exists
    const existingUser = await this.userRepository.findOne({
      where: { email: createMemberDto.email, deletedAt: IsNull() },
    });

    if (existingUser) {
      throw new ConflictException('A user with this email already exists');
    }

    // Generate roll number if not provided
    let rollNumber = createMemberDto.rollNumber;
    if (!rollNumber) {
      rollNumber = await this.generateRollNumber();

      // Ensure generated roll number doesn't already exist
      let attempts = 0;
      const maxAttempts = 10;

      while (attempts < maxAttempts) {
        const existingRollNumber = await this.userRepository.findOne({
          where: { rollNumber, deletedAt: IsNull() },
        });

        if (!existingRollNumber) {
          break; // Found unique roll number
        }

        rollNumber = await this.generateRollNumber(); // Generate new one and try again
        attempts++;
      }

      if (attempts >= maxAttempts) {
        throw new BadRequestException('Unable to generate unique roll number after multiple attempts');
      }
    } else {
      // Check if provided roll number already exists
      const existingRollNumber = await this.userRepository.findOne({
        where: { rollNumber, deletedAt: IsNull() },
      });

      if (existingRollNumber) {
        throw new ConflictException(
          'A user with this roll number already exists',
        );
      }
    }

    // Hash password or generate default
    const password = createMemberDto.password || 'Password@123';
    let hashedPassword: string;

    // Check if password is already hashed (starts with $2b$)
    if (password.startsWith('$2b$')) {
      hashedPassword = password;
    } else {
      hashedPassword = await this.hashPassword(password);
    }

    // Create user entity
    const user = this.userRepository.create({
      firstName: createMemberDto.firstName,
      lastName: createMemberDto.lastName,
      email: createMemberDto.email,
      phoneNumber: createMemberDto.phoneNumber,
      rollNumber: createMemberDto.rollNumber,
      degree: createMemberDto.degree,
      semester: createMemberDto.semester, // ✅ Save semester
      passwordHash: hashedPassword,
      isActive: true,
      roleId: createMemberDto.roleId || 3, // Default to MEMBER role if not specified
    });

    // Save user to database
    const savedUser = await this.userRepository.save(user);

    // Load user with role relation
    const userWithRole = await this.userRepository.findOne({
      where: { id: savedUser.id },
      relations: ['role'],
    });

    if (!userWithRole) {
      throw new Error('Failed to load user with role');
    }

    // Automatically create membership for member
    try {
      // Map membershipStatus string to MembershipStatus enum
      // 'Active' -> ACTIVE (has library membership), 'Inactive' -> INACTIVE (no library membership yet)
      const membershipInitialStatus =
        createMemberDto.membershipStatus === 'Active'
          ? MembershipStatus.ACTIVE
          : MembershipStatus.INACTIVE;

      await this.membershipService.createMembership(
        userWithRole,
        createMemberDto.membershipTypeId.toString(),
        new Date(),
        membershipInitialStatus, // ✅ Pass correct status based on checkMembership() result
      );
    } catch (error) {
      // Don't throw error here - user creation should succeed even if membership creation fails
    }

    return userWithRole;
  }

  async findAll({
    page = 1,
    limit = 10,
    search,
  }: PaginationOptions): Promise<PaginatedResponseDto<User>> {
    const skip = (page - 1) * limit;
    const queryBuilder = this.userRepository
      .createQueryBuilder('user')
      .leftJoinAndSelect('user.memberships', 'membership')
      .leftJoinAndSelect('membership.type', 'membershipType')
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
        deletedAt: IsNull(),
      },
      relations: ['role'],
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
        deletedAt: IsNull(),
      },
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
    if (
      updateUserDto.rollNumber &&
      updateUserDto.rollNumber !== user.rollNumber
    ) {
      const existingRollNumber = await this.userRepository.findOne({
        where: {
          rollNumber: updateUserDto.rollNumber,
          id: Not(id),
          deletedAt: IsNull(),
        },
      });

      if (existingRollNumber) {
        throw new ConflictException(
          'A user with this roll number already exists',
        );
      }
    }

    // Handle membership updates separately
    if (updateUserDto.membershipTypeId || updateUserDto.membershipStatus) {
      const membershipsResult = await this.membershipService.findAllMemberships(undefined, id, { page: 1, limit: 1 });
      const currentMembership = membershipsResult.data[0];

      if (currentMembership) {
        if (updateUserDto.membershipStatus) {
          await this.membershipService.updateMembershipStatus(currentMembership.id, updateUserDto.membershipStatus);
        }
        if (updateUserDto.membershipTypeId) {
          await this.membershipService.updateMembershipType(currentMembership.id, updateUserDto.membershipTypeId);
        }
      } else if (updateUserDto.membershipTypeId) {
        // Create new membership if user doesn't have one
        await this.membershipService.createMembership(user, updateUserDto.membershipTypeId.toString());
      }
    }

    // Handle password update separately if needed
    if ('password' in updateUserDto && updateUserDto.password) {
      const hashedPassword = await this.hashPassword(updateUserDto.password);
      updateUserDto['passwordHash'] = hashedPassword;
      delete updateUserDto['password'];
    }

    // Remove membership fields from user update as they're handled separately
    const { membershipTypeId, membershipStatus, course, ...userUpdateData } = updateUserDto;

    // Map course to semester since that's what the User entity expects
    if (course !== undefined) {
      userUpdateData.semester = course;
    }

    Object.assign(user, userUpdateData);
    return this.userRepository.save(user);
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.userRepository.findOne({
      where: { email, deletedAt: IsNull() },
      relations: ['role'],
    });
  }

  async findByRollNumber(rollNumber: string): Promise<User | null> {
    return this.userRepository.findOne({
      where: { rollNumber, deletedAt: IsNull() },
      relations: ['role'],
    });
  }

  async validateUser(
    identifier: string,
    password: string,
  ): Promise<User | null> {
    // Try to find user by email first
    let user = await this.findByEmail(identifier);

    // If not found by email, try by roll number
    if (!user) {
      user = await this.findByRollNumber(identifier);
    }

    if (!user) {
      return null;
    }

    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);

    return isPasswordValid ? user : null;
  }

  async createStudentFromThirdParty(
    studentDetails: any,
    password: string,
  ): Promise<User> {
    // Extract name from student details
    const fullName = studentDetails.name || '';
    const nameParts = fullName.split(' ');
    const firstName = nameParts[0] || '';
    const lastName = nameParts.slice(1).join(' ') || '';

    // Find default student role
    const studentRole = await this.userRepository.manager
      .getRepository('UserRole')
      .findOne({ where: { name: 'Student' } });

    if (!studentRole) {
      throw new NotFoundException('Student role not found');
    }

    // Find default student membership type
    const studentMembershipType = await this.userRepository.manager
      .getRepository(MembershipType)
      .findOne({ where: { name: 'Student' } });

    if (!studentMembershipType) {
      throw new NotFoundException('Student membership type not found');
    }

    const user = this.userRepository.create({
      firstName,
      lastName,
      email: `${studentDetails.name}@student.isbatuniversity.ac.ug`, // Generate email from roll number
      rollNumber: password,
      phoneNumber: '', // Will be filled later if needed
      degree: studentDetails.programme, // Map programme to degree
      semester: studentDetails.semester, // Map semester directly
      passwordHash: await bcrypt.hash(password, this.saltRounds),
      role: studentRole,
      isActive: true,
      joinDate: new Date(),
    });

    const savedUser = await this.userRepository.save(user);

    // Automatically create membership for the student
    try {
      await this.membershipService.createMembership(
        savedUser,
        studentMembershipType.id.toString(),
        new Date(),
      );
    } catch (error) {
      // Don't throw error here - user creation should succeed even if membership creation fails
    }

    return savedUser;
  }

  async changePassword(userId: string, changePasswordDto: ChangePasswordDto): Promise<void> {
    const user = await this.findOne(userId);

    // Verify current password
    const isCurrentPasswordValid = await bcrypt.compare(
      changePasswordDto.currentPassword,
      user.passwordHash
    );

    if (!isCurrentPasswordValid) {
      throw new BadRequestException('Current password is incorrect');
    }

    // Check if new passwords match
    if (changePasswordDto.newPassword !== changePasswordDto.confirmPassword) {
      throw new BadRequestException('New passwords do not match');
    }

    // Check if new password is same as current password
    const isSamePassword = await bcrypt.compare(
      changePasswordDto.newPassword,
      user.passwordHash
    );

    if (isSamePassword) {
      throw new BadRequestException('New password must be different from current password');
    }

    // Hash and update new password
    const hashedPassword = await this.hashPassword(changePasswordDto.newPassword);
    user.passwordHash = hashedPassword;
    
    await this.userRepository.save(user);
  }

  async updateProfile(userId: string, updateProfileDto: UpdateProfileDto): Promise<User> {
    const user = await this.findOne(userId);

    // Check if email is being updated and conflicts with existing users
    if (updateProfileDto.email && updateProfileDto.email !== user.email) {
      const existingUser = await this.userRepository.findOne({
        where: { email: updateProfileDto.email, id: Not(userId), deletedAt: IsNull() },
      });

      if (existingUser) {
        throw new ConflictException('A user with this email already exists');
      }
    }

    // Handle membership status update separately
    if (updateProfileDto.membershipStatus) {
      const membershipsResult = await this.membershipService.findAllMemberships(undefined, userId, { page: 1, limit: 1 });
      const currentMembership = membershipsResult.data[0];
      
      if (currentMembership) {
        await this.membershipService.updateMembershipStatus(currentMembership.id, updateProfileDto.membershipStatus);
      }
    }

    // Remove membershipStatus from user update as it's not a User entity field
    const { membershipStatus, ...userUpdateData } = updateProfileDto;

    // Update only provided fields
    Object.assign(user, userUpdateData);
    
    return this.userRepository.save(user);
  }

  async forgotPassword(email: string): Promise<void> {
    const user = await this.userRepository.findOne({
      where: { email, deletedAt: IsNull() },
    });

    if (!user) {
      throw new NotFoundException('User with this email not found');
    }

    // TODO: Implement email sending logic
    // Generate reset token, send email with reset link
    // For now, just log - in production, integrate with email service
  }
}
