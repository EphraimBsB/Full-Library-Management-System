import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Membership } from './entities/membership.entity';
import { MembershipType } from 'src/sys-configs/membership-types/entities/membership-type.entity';
import { User } from '../users/entities/user.entity';

export enum MembershipStatus {
  ACTIVE = 'active',
  EXPIRED = 'expired',
  SUSPENDED = 'suspended',
  CANCELLED = 'cancelled'
}

@Injectable()
export class MembershipService {
  constructor(
    @InjectRepository(Membership)
    private readonly membershipRepository: Repository<Membership>,
    @InjectRepository(MembershipType)
    private readonly membershipTypeRepository: Repository<MembershipType>,
  ) {}

  async createMembership(
    user: User,
    membershipTypeId: string,
    startDate: Date = new Date(),
  ): Promise<Membership> {
    const membershipType = await this.membershipTypeRepository.findOne({
      where: { id: Number(membershipTypeId) },
    });

    if (!membershipType) {
      throw new NotFoundException('Membership type not found');
    }

    const expiryDate = new Date(startDate);
    expiryDate.setDate(expiryDate.getDate() + membershipType.maxDurationDays);

    const membership = this.membershipRepository.create({
      user,
      type: membershipType,
      startDate,
      expiryDate,
      status: MembershipStatus.ACTIVE,
      membershipNumber: await this.generateMembershipNumber(membershipType.name),
    });

    return this.membershipRepository.save(membership);
  }

  async findActiveMembership(userId: string): Promise<Membership | null> {
    const now = new Date();
    return this.membershipRepository
      .createQueryBuilder('membership')
      .where('membership.userId = :userId', { userId })
      .andWhere('membership.status = :status', { status: MembershipStatus.ACTIVE })
      .andWhere('membership.expiryDate >= :now', { now })
      .leftJoinAndSelect('membership.type', 'type')
      .getOne();
  }

  async canBorrowBooks(userId: string, requestedCount: number): Promise<{ canBorrow: boolean; reason?: string }> {
    const membership = await this.findActiveMembership(userId);
    if (!membership) {
      return { canBorrow: false, reason: 'No active membership found' };
    }

    if (membership.outstandingFines > 0) {
      return { canBorrow: false, reason: 'Outstanding fines must be paid' };
    }

    const activeLoans = await this.countActiveLoans(userId);
    const remainingSlots = membership.type.maxBooks - activeLoans;

    if (remainingSlots < requestedCount) {
      return { 
        canBorrow: false, 
        reason: `Exceeds borrow limit. You can borrow ${remainingSlots} more book(s).` 
      };
    }

    return { canBorrow: true };
  }

  async countActiveLoans(userId: string): Promise<number> {
    const membership = await this.findActiveMembership(userId);
    if (!membership) return 0;

    const { count } = await this.membershipRepository
      .createQueryBuilder('membership')
      .leftJoin('membership.loans', 'loan')
      .where('membership.id = :membershipId', { membershipId: membership.id })
      .andWhere('loan.returnedAt IS NULL')
      .select('COUNT(loan.id)', 'count')
      .getRawOne();

    return parseInt(count) || 0;
  }

  private async generateMembershipNumber(prefix: string): Promise<string> {
    const count = await this.membershipRepository.count();
    return `${prefix.toUpperCase().substring(0, 3)}-${String(count + 1).padStart(4, '0')}`;
  }

  async getMembershipTypes(): Promise<MembershipType[]> {
    return this.membershipTypeRepository.find();
  }

  async findMembershipTypeById(id: string): Promise<MembershipType> {
    const type = await this.membershipTypeRepository.findOne({ where: { id: Number(id) } });
    if (!type) {
      throw new NotFoundException(`Membership type with ID ${id} not found`);
    }
    return type;
  }

  async findAllMemberships(status?: string, userId?: string): Promise<Membership[]> {
    const query = this.membershipRepository
      .createQueryBuilder('membership')
      .leftJoinAndSelect('membership.user', 'user')
      .leftJoinAndSelect('membership.type', 'type')
      .leftJoinAndSelect('membership.request', 'request');

    if (status) {
      query.andWhere('membership.status = :status', { status });
    }

    if (userId) {
      query.andWhere('membership.userId = :userId', { userId });
    }

    return query.getMany();
  }
}
