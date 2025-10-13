import { DataSource } from 'typeorm';
import { ISeeder, SeedResult } from '../base-seed.interface';
import { Membership, MembershipStatus } from '../../../membership/entities/membership.entity';
import { User } from '../../../users/entities/user.entity';
import { MembershipType } from '../../../sys-configs/membership-types/entities/membership-type.entity';

export class MembershipsSeed implements ISeeder {
  public async run(dataSource: DataSource): Promise<SeedResult> {
    console.log('Seeding memberships...');
    const membershipRepository = dataSource.getRepository(Membership);
    const userRepository = dataSource.getRepository(User);
    const membershipTypeRepository = dataSource.getRepository(MembershipType);

    // Get required data
    const [users, membershipTypes] = await Promise.all([
      userRepository.find({
        relations: ['role'],
        where: {
          role: { name: 'Student' } // Only seed for students initially
        },
        take: 5
      }),
      membershipTypeRepository.find()
    ]);

    if (!users.length || !membershipTypes.length) {
      console.warn('Skipping memberships seeding: No users or membership types found');
      return { entity: 'Membership', count: 0 };
    }

    interface MembershipData {
      membershipNumber: string;
      user: { id: string };
      type: MembershipType;
      startDate: Date;
      expiryDate: Date;
      status: MembershipStatus;
      timesRenewed: number;
      lastRenewalDate: Date | null;
      notes: string;
      createdBy: string;
      updatedBy: string;
    }

    const memberships: MembershipData[] = [];
    const now = new Date();
    
    // Create memberships for each user
    for (const [index, user] of users.entries()) {
      // For variety, assign different membership types
      const membershipType = membershipTypes[index % membershipTypes.length];
      
      // Calculate dates
      const startDate = new Date(now);
      startDate.setMonth(startDate.getMonth() - (index % 12)); // Vary start dates
      
      const expiryDate = new Date(startDate);
      expiryDate.setFullYear(expiryDate.getFullYear() + 1); // 1 year membership
      
      // Determine status based on dates
      let status = MembershipStatus.ACTIVE;
      if (expiryDate < now) {
        status = MembershipStatus.EXPIRED;
      } else if (index % 5 === 0) { // 20% chance of being suspended
        status = MembershipStatus.SUSPENDED;
      }
      
      const membershipData: MembershipData = {
        membershipNumber: `MEM${String(index + 1).padStart(5, '0')}`,
        user: { id: user.id },
        type: membershipType,
        startDate,
        expiryDate,
        status,
        timesRenewed: index % 3, // Vary renewals
        lastRenewalDate: index % 2 === 0 ? startDate : null,
        notes: `Membership for ${user.firstName} ${user.lastName}`,
        createdBy: 'system',
        updatedBy: 'system'
      };
      memberships.push(membershipData);
    }

    let created = 0;
    for (const membershipData of memberships) {
      const exists = await membershipRepository.findOne({
        where: {
          membershipNumber: membershipData.membershipNumber
        }
      });
      
      if (!exists) {
        const membership = membershipRepository.create(membershipData);
        await membershipRepository.save(membership);
        created++;
      }
    }

    return {
      entity: 'Membership',
      count: created
    };
  }
}
