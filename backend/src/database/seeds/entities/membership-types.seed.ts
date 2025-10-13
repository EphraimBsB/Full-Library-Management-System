import { DataSource } from 'typeorm';
import { ISeeder, SeedResult } from '../base-seed.interface';
import { MembershipType } from '../../../sys-configs/membership-types/entities/membership-type.entity';
import { In } from 'typeorm';

export class MembershipTypesSeed implements ISeeder {
  public async run(dataSource: DataSource): Promise<SeedResult> {
    console.log('Seeding membership types...');
    const repository = dataSource.getRepository(MembershipType);
    
    const types = [
      {
        name: 'Student',
        maxBooks: 3,
        maxDurationDays: 14,
        renewalLimit: 2,
        fineRate: 50,
        description: 'Standard membership for students',
        isActive: true
      },
      {
        name: 'Regular',
        maxBooks: 4,
        maxDurationDays: 14,
        renewalLimit: 1,
        fineRate: 100,
        description: 'Standard membership for regular users',
        isActive: true
      },
      {
        name: 'Premium',
        maxBooks: 6,
        maxDurationDays: 21,
        renewalLimit: 2,
        fineRate: 50,
        description: 'Premium membership with extended benefits',
        isActive: true
      },
      {
        name: 'Faculty',
        maxBooks: 10,
        maxDurationDays: 30,
        renewalLimit: 3,
        fineRate: 0,
        description: 'Special membership for faculty members',
        isActive: true
      },
      {
        name: 'Researcher',
        maxBooks: 8,
        maxDurationDays: 60,
        renewalLimit: 3,
        fineRate: 25,
        description: 'For research staff with extended loan periods',
        isActive: true
      },
      {
        name: 'Alumni',
        maxBooks: 2,
        maxDurationDays: 14,
        renewalLimit: 1,
        fineRate: 150,
        description: 'Basic membership for alumni members',
        isActive: true
      }
    ];

    let created = 0;
    const results: string[] = [];
    
    for (const type of types) {
      let existingType = await repository.findOneBy({ name: type.name });
      
      if (!existingType) {
        const newType = repository.create(type);
        await repository.save(newType);
        created++;
        results.push(`Created membership type: ${type.name}`);
      } else {
        // Update existing type if needed
        Object.assign(existingType, type);
        await repository.save(existingType);
        results.push(`Updated membership type: ${type.name}`);
      }
    }

    console.log(results.join('\n'));
    return {
      entity: 'MembershipType',
      count: created
    };
  }
}
