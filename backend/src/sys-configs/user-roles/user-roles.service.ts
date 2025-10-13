import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserRole } from './entities/user-role.entity';
import { CreateUserRoleDto } from './dto/create-user-role.dto';
import { UpdateUserRoleDto } from './dto/update-user-role.dto';

@Injectable()
export class UserRolesService {
  constructor(
    @InjectRepository(UserRole)
    private readonly userRoleRepository: Repository<UserRole>,
  ) {}

  async create(createUserRoleDto: CreateUserRoleDto): Promise<UserRole> {
    const userRole = this.userRoleRepository.create({
      ...createUserRoleDto,
      permissions: createUserRoleDto.permissions || [],
    });
    return await this.userRoleRepository.save(userRole);
  }

  async findAll(): Promise<UserRole[]> {
    return await this.userRoleRepository.find();
  }

  async findOne(id: number): Promise<UserRole> {
    const userRole = await this.userRoleRepository.findOne({ where: { id } });
    if (!userRole) {
      throw new NotFoundException(`User role with ID ${id} not found`);
    }
    return userRole;
  }

  async toggleStatus(id: number): Promise<UserRole | null> {
    const userRole = await this.findOne(id);
    userRole.isActive = !userRole.isActive;
    return await this.userRoleRepository.save(userRole);
  }

  async update(
    id: number,
    updateUserRoleDto: UpdateUserRoleDto,
  ): Promise<UserRole> {
    const userRole = await this.findOne(id);
    Object.assign(userRole, updateUserRoleDto);
    return await this.userRoleRepository.save(userRole);
  }

  async remove(id: number): Promise<void> {
    const result = await this.userRoleRepository.softDelete(id);
    if (result.affected === 0) {
      throw new NotFoundException(`User role with ID ${id} not found`);
    }
  }
}
