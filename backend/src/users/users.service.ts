import { Injectable, NotFoundException, ConflictException, BadRequestException, Inject, forwardRef } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Not, IsNull } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User } from './entities/user.entity';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { PaginationOptions } from '../common/interfaces/pagination-options.interface';
import { PaginatedResponseDto } from '../common/dto/paginated-response.dto';

@Injectable()
export class UsersService {
  private readonly saltRounds = 10;

  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

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
