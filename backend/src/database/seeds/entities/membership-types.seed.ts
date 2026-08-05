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
        maxDurationDays: 180, // 6 months (academic semester)
        loanPeriodDays: 14,
        gracePeriodDays: 3,
        renewalLimit: 2,
        fineRate: 50,
        description: 'Standard membership for students (6 months)',
        isActive: true,
      },
      {
        name: 'Regular',
        maxBooks: 4,
        maxDurationDays: 365, // 1 year
        loanPeriodDays: 21,
        gracePeriodDays: 2,
        renewalLimit: 1,
        fineRate: 100,
        description: 'Standard membership for regular users (1 year)',
        isActive: true,
      },
      {
        name: 'Premium',
        maxBooks: 6,
        maxDurationDays: 1095, // 3 years
        loanPeriodDays: 30,
        gracePeriodDays: 5,
        renewalLimit: 2,
        fineRate: 50,
        description: 'Premium membership with extended benefits (3 years)',
        isActive: true,
      },
      {
        name: 'Faculty',
        maxBooks: 10,
        maxDurationDays: 365, // 1 year
        loanPeriodDays: 30,
        gracePeriodDays: 7,
        renewalLimit: 3,
        fineRate: 0,
        description: 'Special membership for faculty members (1 year)',
        isActive: true,
      },
      {
        name: 'Researcher',
        maxBooks: 8,
        maxDurationDays: 1825, // 5 years
        loanPeriodDays: 30,
        gracePeriodDays: 5,
        renewalLimit: 3,
        fineRate: 25,
        description: 'For research staff with extended loan periods (5 years)',
        isActive: true,
      },
      {
        name: 'Alumni',
        maxBooks: 2,
        maxDurationDays: 730, // 2 years
        loanPeriodDays: 30,
        gracePeriodDays: 1,
        renewalLimit: 1,
        fineRate: 150,
        description: 'Basic membership for alumni members (2 years)',
        isActive: true,
      },
    ];

    let created = 0;
    const results: string[] = [];

    for (const type of types) {
      const existingType = await repository.findOneBy({ name: type.name });

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
      count: created,
    };
  }
}
