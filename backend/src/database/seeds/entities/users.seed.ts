import { DataSource } from 'typeorm';
import { ISeeder, SeedResult } from '../base-seed.interface';
import { User } from '../../../users/entities/user.entity';
import { UserRole } from '../../../sys-configs/user-roles/entities/user-role.entity';
import * as bcrypt from 'bcrypt';
import { faker } from '@faker-js/faker';

// Ugandan name data
const UGANDAN_NAMES = {
  maleFirstNames: [
    'John', 'David', 'Joseph', 'Peter', 'James', 'Richard', 'Daniel', 'Michael', 'Robert', 'William',
    'Alex', 'Brian', 'Charles', 'Edward', 'Fred', 'George', 'Henry', 'Isaac', 'Kevin', 'Lawrence',
    'Martin', 'Nicholas', 'Patrick', 'Quincy', 'Samuel', 'Thomas', 'Victor', 'Yusuf', 'Zachary', 'Andrew'
  ],
  femaleFirstNames: [
    'Mary', 'Sarah', 'Esther', 'Grace', 'Ruth', 'Prossy', 'Florence', 'Dorothy', 'Joyce', 'Alice',
    'Agnes', 'Beatrice', 'Caroline', 'Diana', 'Elizabeth', 'Fiona', 'Gloria', 'Hellen', 'Irene', 'Jackie',
    'Khadija', 'Lilian', 'Martha', 'Nancy', 'Olivia', 'Patricia', 'Queen', 'Rita', 'Susan', 'Tracy'
  ],
  lastNames: [
    'Mugisha', 'Nakimuli', 'Ocen', 'Nalwanga', 'Kigozi', 'Nakato', 'Nakimera', 'Nabukenya', 'Nakayiza', 'Nakibuka',
    'Kasozi', 'Nabatanzi', 'Kawuma', 'Kivumbi', 'Lubega', 'Mugerwa', 'Nakintu', 'Ojok', 'Ssempijja', 'Wasswa',
    'Babirye', 'Kisakye', 'Nakabugo', 'Nalubega', 'Nabukenya', 'Nakato', 'Nakawunde', 'Nabukwasi', 'Nakayima', 'Nakitto'
  ],
  districts: [
    'Kampala', 'Wakiso', 'Mukono', 'Jinja', 'Mbarara', 'Gulu', 'Mbale', 'Lira', 'Arua', 'Masaka',
    'Mityana', 'Mubende', 'Hoima', 'Masindi', 'Kabale', 'Mbarara', 'Fort Portal', 'Kasese', 'Soroti', 'Tororo'
  ],
  streets: [
    'Kampala Road', 'Jinja Road', 'Nkrumah Road', 'Entebbe Road', 'Ggaba Road', 'Bombo Road', 'Ntinda Road', 'Bombo Road',
    'Kiira Road', 'Nakasero Road', 'Kololo Road', 'Lugogo Bypass', 'Yusuf Lule Road', 'Acacia Avenue', 'Mengo Hill Road'
  ]
};

// Helper function to generate Ugandan phone numbers
const generateUgandanPhoneNumber = (): string => {
  const prefixes = ['70', '71', '72', '74', '75', '76', '77', '78', '79', '39', '41'];
  const prefix = faker.helpers.arrayElement(prefixes);
  return `+256${prefix}${faker.string.numeric(7)}`;
};

// Generate random Ugandan names with more variety
const generateUgandanName = (gender: 'male' | 'female') => {
  const firstName = gender === 'male'
    ? faker.helpers.arrayElement(UGANDAN_NAMES.maleFirstNames)
    : faker.helpers.arrayElement(UGANDAN_NAMES.femaleFirstNames);

  const lastName = faker.helpers.arrayElement(UGANDAN_NAMES.lastNames);

  return { firstName, lastName };
};

// Generate Ugandan address
const generateUgandanAddress = () => {
  const district = faker.helpers.arrayElement(UGANDAN_NAMES.districts);
  const street = faker.helpers.arrayElement(UGANDAN_NAMES.streets);
  const buildingNumber = faker.number.int({ min: 1, max: 200 });
  const postalCode = `UGA-${faker.string.numeric(5)}`;
  
  return {
    street: `${buildingNumber} ${street}`,
    city: district,
    country: 'Uganda',
    postalCode,
    addressLine1: `P.O. Box ${faker.number.int({ min: 1000, max: 99999 })} ${district}`,
    addressLine2: `${district} District, Uganda`
  };
};

// Generate user credentials
const generateUserCredentials = async (password: string = 'Password@123') => {
  const saltRounds = 10;
  const passwordHash = await bcrypt.hash(password, saltRounds);
  const emailVerificationToken = faker.string.uuid();
  const passwordResetToken = faker.datatype.boolean(0.2) ? faker.string.uuid() : null;
  const passwordResetExpires = passwordResetToken ? 
    faker.date.future({ years: 0.1 }) : null;
  
  return {
    passwordHash,
    emailVerificationToken,
    emailVerified: faker.datatype.boolean(0.8), // 80% chance email is verified
    passwordResetToken,
    passwordResetExpires
  };
};

// Generate contact information
const generateContactInfo = () => {
  return {
    phoneNumber: generateUgandanPhoneNumber()
  };
};

// Academic departments
const DEPARTMENTS = [
  'Computer Science', 'Information Technology', 'Software Engineering', 'Data Science',
  'Information Systems', 'Cybersecurity', 'Artificial Intelligence', 'Computer Engineering',
  'Library and Information Science', 'Network Engineering', 'Data Analytics', 'Web Development',
  'Mobile Application Development', 'Cloud Computing', 'Database Management', 'IT Project Management'
];

// Generate academic information based on role
const generateAcademicInfo = (role: any, index: number) => {
  const department = faker.helpers.arrayElement(DEPARTMENTS);
  const currentYear = new Date().getFullYear();
  const joinYear = faker.number.int({ min: currentYear - 5, max: currentYear });
  
  if (role.name === 'Student') {
      return {
      degree: `BSc in ${department}`,
      department
    };
  } 
  
  if (role.name === 'Faculty') {
    return {
      degree: faker.helpers.arrayElement(['PhD', 'MSc', 'MBA']),
      department
    };
  }
  
  if (role.name === 'Librarian') {
    return {
      degree: faker.helpers.arrayElement(['BSc', 'MLIS', 'MIS']),
      department: 'Library'
    };
  }
  
  // Admin staff
  return {
    degree: faker.helpers.arrayElement(['BBA', 'MBA', 'MSc']),
    department: faker.helpers.arrayElement(['Administration', 'IT', 'Finance', 'HR', 'Academic Affairs'])
  };
};

export class UsersSeed implements ISeeder {
  public async run(dataSource: DataSource): Promise<SeedResult> {
    console.log('Seeding users...');
    const userRepository = dataSource.getRepository(User);
    const userRoleRepository = dataSource.getRepository(UserRole);

    // Get required roles
    const [adminRole, librarianRole, studentRole, facultyRole] = await Promise.all([
      userRoleRepository.findOneBy({ name: 'Admin' }),
      userRoleRepository.findOneBy({ name: 'Librarian' }),
      userRoleRepository.findOneBy({ name: 'Student' }),
      userRoleRepository.findOneBy({ name: 'Faculty' })
    ]);

    if (!adminRole || !librarianRole || !studentRole || !facultyRole) {
      console.warn('Skipping users seeding: Required roles not found');
      return { entity: 'User', count: 0 };
    }

    const now = new Date();
    const oneYearFromNow = new Date();
    oneYearFromNow.setFullYear(now.getFullYear() + 1);

    // Common user data
    const commonUserData = {
      isActive: true,
      joinDate: now,
      expiryDate: oneYearFromNow,
      avatarUrl: faker.helpers.arrayElement([
        'default_avatar.png',
        `avatar_${faker.number.int({ min: 1, max: 10 })}.jpg`
      ]),
      ...(await generateUserCredentials('Password@123')),
      phoneNumber: generateUgandanPhoneNumber(),
      dateOfBirth: faker.date.birthdate({ min: 18, max: 65, mode: 'age' })
    };

    // Admin users (2)
    const adminUsers = Array.from({ length: 2 }, (_, i) => {
      const gender = i % 2 === 0 ? 'male' : 'female' as const;
      const { firstName, lastName } = generateUgandanName(gender);
      const email = i === 0 ? 'admin@isbat.edu' : `admin${i + 1}@isbat.edu`;
      
      return {
        firstName,
        lastName,
        email,
        rollNumber: `ADM${String(i + 1).padStart(3, '0')}`,
        role: adminRole,
        roleId: adminRole.id,
        ...commonUserData,
        ...generateAcademicInfo(adminRole, i)
      };
    });

    // Librarian users (5)
    const librarianUsers = Array.from({ length: 5 }, (_, i) => {
      const gender = Math.random() > 0.5 ? 'male' : 'female' as const;
      const { firstName, lastName } = generateUgandanName(gender);
      
      return {
        firstName,
        lastName,
        email: `librarian${i + 1}@isbat.edu`,
        rollNumber: `LIB${String(i + 1).padStart(3, '0')}`,
        role: librarianRole,
        roleId: librarianRole.id,
        ...commonUserData,
        ...generateAcademicInfo(librarianRole, i)
      };
    });

    // Faculty users (15)
    const facultyUsers = Array.from({ length: 15 }, (_, i) => {
      const gender = Math.random() > 0.5 ? 'male' : 'female' as const;
      const { firstName, lastName } = generateUgandanName(gender);
      
      return {
        firstName,
        lastName,
        email: `faculty${i + 1}@isbat.edu`,
        rollNumber: `FAC${String(i + 1).padStart(3, '0')}`,
        role: facultyRole,
        roleId: facultyRole.id,
        ...commonUserData,
        ...generateAcademicInfo(facultyRole, i),
        researchGateUrl: `https://www.researchgate.net/profile/${firstName}-${lastName}-${i + 1}`,
        googleScholarUrl: `https://scholar.google.com/citations?user=${faker.string.alphanumeric(12)}`,
        orcidId: faker.string.numeric(16).match(/.{1,4}/g)?.join('-'),
        publications: faker.number.int({ min: 0, max: 50 })
      };
    });

    // Student users (50)
    const studentUsers = Array.from({ length: 50 }, (_, i) => {
      const gender = Math.random() > 0.5 ? 'male' : 'female' as const;
      const { firstName, lastName } = generateUgandanName(gender);
      
      return {
        firstName,
        lastName,
        email: `student${i + 1}@isbat.edu`,
        rollNumber: `STU${String(i + 1).padStart(4, '0')}`,
        role: studentRole,
        roleId: studentRole.id,
          ...commonUserData,
        ...generateAcademicInfo(studentRole, i),
        parentName: faker.person.fullName(),
        parentPhone: generateUgandanPhoneNumber(),
        parentEmail: faker.internet.email({ firstName: faker.person.firstName(), lastName: faker.person.lastName() }),
        highSchool: `${faker.location.city()} Secondary School`,
        highSchoolGraduationYear: faker.number.int({ min: 2015, max: 2023 }),
        scholarship: faker.datatype.boolean(0.2) ? faker.helpers.arrayElement([
          'Academic Excellence', 'Sports', 'Need-Based', 'Merit-Based'
        ]) : null
      };
    });

    // Combine all users
    const users = [
      ...adminUsers,
      ...librarianUsers,
      ...facultyUsers,
      ...studentUsers
    ];

    // Create users in the database with batch processing
    const BATCH_SIZE = 20;
    const createdUsers: User[] = [];
    const results: string[] = [];

    for (let i = 0; i < users.length; i += BATCH_SIZE) {
      const batch = users.slice(i, i + BATCH_SIZE);
      
      try {
        const savedUsers = await userRepository.save(batch);
        savedUsers.forEach(user => {
          createdUsers.push(user);
          results.push(`✅ Created user: ${user.email} (${user.role?.name})`);
        });
        
        // Add a small delay between batches to prevent database overload
        if (i + BATCH_SIZE < users.length) {
          await new Promise(resolve => setTimeout(resolve, 500));
        }
      } catch (error: any) {
        // Handle batch errors by trying individual saves
        for (const userData of batch) {
          try {
            const user = userRepository.create(userData);
            await userRepository.save(user);
            createdUsers.push(user);
            results.push(`✅ Created user: ${user.email} (${user.role?.name})`);
          } catch (individualError: any) {
            if (individualError.code === '23505') { // Unique violation
              results.push(`⚠️  User already exists: ${userData.email}`);
            } else {
              results.push(`❌ Error creating user ${userData.email}: ${individualError.message}`);
              console.error(`Error creating user ${userData.email}:`, individualError);
            }
          }
        }
      }
    }

    console.log(`\n=== User Seeding Summary ===`);
    console.log(`Total users processed: ${users.length}`);
    console.log(`Successfully created: ${createdUsers.length}`);
    console.log(`Already existed: ${users.length - createdUsers.length}`);
    
    if (results.length > 10) {
      console.log('\nFirst 10 results:');
      console.log(results.slice(0, 10).join('\n'));
      console.log(`... and ${results.length - 10} more`);
    } else {
      console.log('\nResults:');
      console.log(results.join('\n'));
    }

    return {
      entity: 'User',
      count: createdUsers.length,
      details: {
        total: users.length,
        created: createdUsers.length,
        skipped: users.length - createdUsers.length,
        roles: {
          admin: adminUsers.length,
          librarian: librarianUsers.length,
          faculty: facultyUsers.length,
          student: studentUsers.length
        }
      }
    };
  }
}
