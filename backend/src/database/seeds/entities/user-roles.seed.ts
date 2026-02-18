import { DataSource } from 'typeorm';
import { ISeeder, SeedResult } from '../base-seed.interface';
import { UserRole } from '../../../sys-configs/user-roles/entities/user-role.entity';

export class UserRolesSeed implements ISeeder {
  public async run(dataSource: DataSource): Promise<SeedResult> {
    console.log('Seeding user roles...');
    const repository = dataSource.getRepository(UserRole);

    const roles = [
      {
        name: 'Admin',
        description: 'System administrator with full access',
        permissions: [
          'users:manage',
          'books:manage',
          'loans:manage',
          'reports:view',
          'system:configure',
        ],
      },
      {
        name: 'Librarian',
        description: 'Library staff member with limited administrative access',
        permissions: ['books:manage', 'loans:manage', 'reports:view'],
      },
      {
        name: 'Member',
        description: 'Regular library member',
        permissions: ['books:borrow', 'profile:manage'],
      },
    ];

    let created = 0;
    for (const role of roles) {
      const exists = await repository.findOneBy({ name: role.name });
      if (!exists) {
        const newRole = repository.create(role);
        await repository.save(newRole);
        created++;
      }
    }

    return {
      entity: 'UserRole',
      count: created,
    };
  }
}
