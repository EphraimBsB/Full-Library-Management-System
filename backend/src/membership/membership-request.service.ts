import { Injectable, NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DeepPartial } from 'typeorm';
import { MembershipRequest, MembershipRequestStatus } from './entities/membership-request.entity';
import { Membership, MembershipStatus } from './entities/membership.entity';
import { User } from '../users/entities/user.entity';
import { MembershipType } from 'src/sys-configs/membership-types/entities/membership-type.entity';
import { CreateMembershipRequestDto } from './dto/create-membership-request.dto';
import { UserRole } from 'src/sys-configs/user-roles/entities/user-role.entity';

@Injectable()
export class MembershipRequestService {
  constructor(
    @InjectRepository(MembershipRequest)    private readonly requestRepository: Repository<MembershipRequest>,
    @InjectRepository(Membership)
    private readonly membershipRepository: Repository<Membership>,
    @InjectRepository(MembershipType)
    private readonly membershipTypeRepository: Repository<MembershipType>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(UserRole)
    private readonly userRoleRepository: Repository<UserRole>,
  ) {}

  private calculateExpiryDate(validityPeriodDays: number): Date {
    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() + validityPeriodDays);
    return expiryDate;
  }

  private async generateMembershipNumber(): Promise<string> {
    // Generate a random 6-digit number
    const randomNum = Math.floor(100000 + Math.random() * 900000);
    const prefix = 'MEM';
    const membershipNumber = `${prefix}${randomNum}`;
    
    // Check if the generated number already exists
    const existingMembership = await this.membershipRepository.findOne({
      where: { membershipNumber }
    });
    
    // If it exists, generate a new one recursively
    if (existingMembership) {
      return this.generateMembershipNumber();
    }
    
    return membershipNumber;
  }

  async getRequestById(id: string): Promise<MembershipRequest> {
    const request = await this.requestRepository.findOne({
      where: { id },
      relations: ['user', 'membershipType', 'processedBy']
    });

    if (!request) {
      throw new NotFoundException(`Membership request with ID ${id} not found`);
    }

    return request;
  }

  async createRequest(createDto: CreateMembershipRequestDto) {

    // Check if user exists by email
    let user = await this.userRepository.findOne({
      where: { email: createDto.email }
    });

    // If rollNumber is provided, check if it's already in use by another user
    if (createDto.rollNumber) {
      const existingUserWithRollNumber = await this.userRepository.findOne({
        where: { rollNumber: createDto.rollNumber }
      });
      
      if (existingUserWithRollNumber && existingUserWithRollNumber.email !== createDto.email) {
        throw new ConflictException('Roll number is already in use by another user');
      }
    }

    // Create or update user
    if (!user) {
      let role = await this.userRoleRepository.findOne({
        where: { id: createDto.roleId }
      });
      const userData: Partial<User> = {
        email: createDto.email,
        firstName: createDto.firstName,
        lastName: createDto.lastName,
        phoneNumber: createDto.phoneNumber,
        rollNumber: createDto.rollNumber,
        degree: createDto.degree,
        isActive: false, // Will be activated when request is approved
        role: role!,
        joinDate: new Date(), // Set the join date to now
        passwordHash: createDto.rollNumber // Temporary password, should be reset later
      };
      
      user = this.userRepository.create(userData);
    }

    // Save user
    user = await this.userRepository.save(user);

    // Check if user already has an active membership
    const activeMembership = await this.membershipRepository.findOne({
      where: {
        userId: user.id,
        status: MembershipStatus.ACTIVE,
      },
    });

    if (activeMembership) {
      throw new ConflictException('You already have an active membership');
    }

    // Check for existing pending request
    const existingRequest = await this.requestRepository.findOne({
      where: {
        user: { id: user.id },
        status: MembershipRequestStatus.PENDING,
      },
    });

    if (existingRequest) {
      throw new ConflictException('You already have a pending membership request');
    }

    // Verify membership type exists
    const membershipType = await this.membershipTypeRepository.findOne({
      where: { id: Number(createDto.membershipTypeId) },
    });

    if (!membershipType) {
      throw new NotFoundException('Membership type not found');
    }

    // Create the membership request with all required fields
    const requestData: DeepPartial<MembershipRequest> = {
      user: { id: user.id },
      userId: user.id,
      membershipType: { id: Number(createDto.membershipTypeId) },
      membershipTypeId: createDto.membershipTypeId,
      status: MembershipRequestStatus.PENDING,
      notes: createDto.notes || null,
      rejectionReason: null,
      processedById: null,
      processedBy: null,
      processedAt: null
    };

    const request = this.requestRepository.create(requestData);
    await this.requestRepository.save(request);
    
    // Return the request with user and membership type details
    return this.getRequestById(request.id);
  }

  async approveRequest(
    requestId: string,
    processedBy: User
  ): Promise<{ request: MembershipRequest; user: User }> {
    // 1. Get the request with relations in a single query
    const request = await this.getRequestById(requestId);

    if (request.status !== MembershipRequestStatus.PENDING) {
      // If already approved, just return the current request
      if (request.status === MembershipRequestStatus.APPROVED) {
        const updatedUser = await this.userRepository.findOne({
          where: { id: request.user.id },
        });
        
        if (!updatedUser) {
          throw new BadRequestException('User not found');
        }
        
        return { 
          request, 
          user: updatedUser 
        };
      }
      throw new ConflictException('This request has already been processed');
    }

    // 2. Prepare data for updates
    const now = new Date();
    const expiryDate = this.calculateExpiryDate(request.membershipType.maxDurationDays);
    const membershipNumber = await this.generateMembershipNumber();
    
    // 3. Execute all updates in a single transaction
    try {
      return await this.requestRepository.manager.transaction(async (transactionalEntityManager) => {
        // Update request status with processedBy relation
        await transactionalEntityManager.update(
          MembershipRequest,
          { id: requestId },
          {
            status: MembershipRequestStatus.APPROVED,
            processedById: processedBy.id,
            processedAt: now,
          }
        );

        // Update user status and role if needed
        const userUpdate: any = { isActive: true };
        
        await transactionalEntityManager.update(
          User,
          { id: request.user.id },
          userUpdate
        );

        // Create membership with generated membership number
        await transactionalEntityManager.insert(Membership, {
          membershipNumber,
          userId: request.user.id,
          membershipTypeId: request.membershipType.id,
          startDate: now,
          expiryDate,
          status: MembershipStatus.ACTIVE,
          requestId: requestId,
        });

        // Fetch the updated request with all relations
        const updatedRequest = await transactionalEntityManager
          .createQueryBuilder(MembershipRequest, 'request')
          .leftJoinAndSelect('request.user', 'user')
          .leftJoinAndSelect('request.membershipType', 'membershipType')
          .leftJoinAndSelect('request.processedBy', 'processedBy')
          .where('request.id = :requestId', { requestId })
          .getOne();

        if (!updatedRequest) {
          throw new Error('Failed to fetch updated request');
        }

        const updatedUser = await transactionalEntityManager.findOne(User, {
          where: { id: request.user.id },
        });

        if (!updatedUser) {
          throw new Error('Failed to fetch updated user');
        }

        const membership = await transactionalEntityManager.findOne(Membership, {
          where: { userId: request.user.id },
        });

        if (!membership) {
          throw new Error('Failed to fetch updated membership');
        }

        return { 
          request: updatedRequest, 
          user: updatedUser,
          membership: membership,
        };
      });
    } catch (error) {
      console.error('Error in approveRequest transaction:', error);
      throw new BadRequestException(
        error.message || 'Failed to approve membership request'
      );
    }
  }

  async rejectRequest(
    requestId: string,
    processedBy: User,
    reason: string
  ): Promise<{ request: MembershipRequest; user: User }> {

    // 1. Get the request with relations
    const request = await this.requestRepository.findOne({
      where: { id: requestId },
      relations: ['user'],
    });

    if (!request) {
      throw new NotFoundException('Membership request not found');
    }

    // 2. Check if request is already processed
    if (request.status !== MembershipRequestStatus.PENDING) {
      throw new ConflictException('This request has already been processed');
    }

    // 3. Update request status
    const updatedRequest = await this.requestRepository.save({
      ...request,
      status: MembershipRequestStatus.REJECTED,
      processedBy,
      processedAt: new Date(),
      rejectionReason: reason,
    });

    // 4. Get the user
    const user = await this.userRepository.findOne({
      where: { id: request.user.id },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return {
      request: await this.getRequestById(updatedRequest.id),
      user,
    };
  }

  async getAllRequests(status?: MembershipRequestStatus): Promise<MembershipRequest[]> {
    const where = status ? { status } : {};
    return this.requestRepository.find({
      where,
      relations: ['user', 'membershipType', 'processedBy'],
      order: { createdAt: 'DESC' },
    });
  }

  async getUserRequests(userId: string): Promise<MembershipRequest[]> {
    return this.requestRepository.find({
      where: { user: { id: userId } },
      relations: ['membershipType', 'processedBy'],
      order: { createdAt: 'DESC' },
    });
  }
}
