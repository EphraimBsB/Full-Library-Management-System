import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { MembershipType } from './entities/membership-type.entity';
import {
  Membership,
  MembershipStatus,
} from 'src/membership/entities/membership.entity';
import { CreateMembershipTypeDto } from './dto/create-membership-type.dto';
import { UpdateMembershipTypeDto } from './dto/update-membership-type.dto';

@Injectable()
export class MembershipTypesService {
  constructor(
    @InjectRepository(MembershipType)
    private readonly membershipTypeRepository: Repository<MembershipType>,
    @InjectRepository(Membership)
    private readonly membershipRepository: Repository<Membership>,
  ) {}

  async create(
    createMembershipTypeDto: CreateMembershipTypeDto,
  ): Promise<MembershipType> {
    const membershipType = this.membershipTypeRepository.create(
      createMembershipTypeDto,
    );
    return await this.membershipTypeRepository.save(membershipType);
  }

  async findAll(): Promise<MembershipType[]> {
    return await this.membershipTypeRepository.find();
  }

  async findOne(id: number): Promise<MembershipType> {
    const membershipType = await this.membershipTypeRepository.findOne({
      where: { id },
    });
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
    // Check if there are any active memberships using this type
    const activeMembershipsCount = await this.membershipRepository.count({
      where: {
        membershipTypeId: id,
        status: MembershipStatus.ACTIVE,
      },
    });

    if (activeMembershipsCount > 0) {
      throw new ConflictException(
        `Cannot delete membership type. It is currently being used by ${activeMembershipsCount} active membership(s). Please deactivate or reassign these memberships first.`,
      );
    }

    const result = await this.membershipTypeRepository.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException(`Membership type with ID ${id} not found`);
    }
  }
}
