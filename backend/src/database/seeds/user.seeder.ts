import { DataSource, QueryRunner } from 'typeorm';
import { User } from '../../users/entities/user.entity';
import * as bcrypt from 'bcrypt';
import { UserRole } from '../../common/enums/user-role.enum';

export class UserSeeder {
  constructor(private dataSource: DataSource) {}

  async seed(queryRunner: QueryRunner) {
    const passwordHash = await bcrypt.hash('password123', 10);
    const users = [
      {
        id: '00000000-0000-0000-0000-000000000001',
        firstName: 'Admin',
        lastName: 'User',
        email: 'admin@isbat.edu',
        rollNumber: 'ADMIN001',
        phoneNumber: '+256700000000',
        role: UserRole.ADMIN,
        isActive: true,
        joinDate: new Date('2023-01-01'),
        passwordHash,
      },
      {
        id: '00000000-0000-0000-0000-000000000002',
        firstName: 'Librarian',
        lastName: 'One',
        email: 'librarian@isbat.edu',
        rollNumber: 'LIB001',
        phoneNumber: '+256700000001',
        role: UserRole.LIBRARIAN,
        isActive: true,
        joinDate: new Date('2023-01-15'),
        passwordHash,
      },
      {
        id: '00000000-0000-0000-0000-000000000003',
        firstName: 'John',
        lastName: 'Doe',
        email: 'john.doe@student.isbat.edu',
        rollNumber: 'STU001',
        phoneNumber: '+256700000002',
        role: UserRole.MEMBER,
        isActive: true,
        joinDate: new Date('2023-02-01'),
        expiryDate: new Date('2024-12-31'),
        course: 'Computer Science',
        passwordHash,
      },
      {
        id: '00000000-0000-0000-0000-000000000004',
        firstName: 'Jane',
        lastName: 'Smith',
        email: 'jane.smith@student.isbat.edu',
        rollNumber: 'STU002',
        phoneNumber: '+256700000003',
        role: UserRole.MEMBER,
        isActive: true,
        joinDate: new Date('2023-02-15'),
        expiryDate: new Date('2024-12-31'),
        course: 'Information Technology',
        passwordHash,
      },
      {
        id: '00000000-0000-0000-0000-000000000005',
        firstName: 'Michael',
        lastName: 'Johnson',
        email: 'michael.johnson@student.isbat.edu',
        rollNumber: 'STU003',
        phoneNumber: '+256700000004',
        role: UserRole.MEMBER,
        isActive: true,
        joinDate: new Date('2023-03-01'),
        expiryDate: new Date('2024-12-31'),
        course: 'Business Administration',
        passwordHash,
      },
    ];

    await queryRunner.manager
      .createQueryBuilder()
      .insert()
      .into(User)
      .values(users)
      .execute();
    
    console.log(`✅ Seeded ${users.length} users`);
    return users;
  }
}
