import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { MembershipType } from './entities/membership-type.entity';
import { CreateMembershipTypeDto } from './dto/create-membership-type.dto';
import { UpdateMembershipTypeDto } from './dto/update-membership-type.dto';

@Injectable()
export class MembershipTypesService {
  constructor(
    @InjectRepository(MembershipType)
    private readonly membershipTypeRepository: Repository<MembershipType>,
  ) {}

  async create(createMembershipTypeDto: CreateMembershipTypeDto): Promise<MembershipType> {
    const membershipType = this.membershipTypeRepository.create(createMembershipTypeDto);
    return await this.membershipTypeRepository.save(membershipType);
  }

  async findAll(): Promise<MembershipType[]> {
    return await this.membershipTypeRepository.find();
  }

  async findOne(id: number): Promise<MembershipType> {
    const membershipType = await this.membershipTypeRepository.findOne({ where: { id } });
    if (!membershipType) {
      throw new NotFoundException(`Membership type with ID ${id} not found`);
    }
    return membershipType;
  }

  async update(
    id: number,
    updateMembershipTypeDto: UpdateMembershipTypeDto,
  ): Promise<MembershipType> {
    const membershipType = await this.findOne(id);
    Object.assign(membershipType, updateMembershipTypeDto);
    return await this.membershipTypeRepository.save(membershipType);
  }

  async remove(id: number): Promise<void> {
    const result = await this.membershipTypeRepository.softDelete(id);
    if (result.affected === 0) {
      throw new NotFoundException(`Membership type with ID ${id} not found`);
    }
  }
}
