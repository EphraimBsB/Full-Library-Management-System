import { DataSource } from 'typeorm';
import { ISeeder, SeedResult } from '../base-seed.interface';
import { Degree, DegreeLevel } from '../../../sys-configs/degrees/entities/degree.entity';

export class DegreesSeed implements ISeeder {
  public async run(dataSource: DataSource): Promise<SeedResult> {
    console.log('Seeding degrees...');
    const repository = dataSource.getRepository(Degree);
    
    const degrees = [
      { 
        name: 'Diploma in Computer Science', 
        code: 'DIPCS',
        level: DegreeLevel.DIPLOMA, 
        description: 'Two-year diploma program in computer science fundamentals' 
      },
      { 
        name: 'Bachelor of Science in Computer Science', 
        code: 'BSCS',
        level: DegreeLevel.BACHELORS, 
        description: 'Four-year undergraduate degree in computer science' 
      },
      { 
        name: 'Master of Science in Computer Science', 
        code: 'MSCS',
        level: DegreeLevel.MASTERS, 
        description: 'Graduate degree in advanced computer science topics' 
      },
      { 
        name: 'Doctor of Philosophy in Computer Science', 
        code: 'PHD',
        level: DegreeLevel.PHD, 
        description: 'Doctoral program in computer science research' 
      },
      { 
        name: 'Bachelor of Business Administration', 
        code: 'BBA',
        level: DegreeLevel.BACHELORS, 
        description: 'Undergraduate degree in business administration' 
      },
      { 
        name: 'Master of Business Administration', 
        code: 'MBA',
        level: DegreeLevel.MASTERS, 
        description: 'Graduate degree in business administration' 
      },
      { 
        name: 'Bachelor of Arts in English Literature', 
        code: 'BAEL',
        level: DegreeLevel.BACHELORS, 
        description: 'Undergraduate degree in English literature' 
      },
      { 
        name: 'Bachelor of Engineering', 
        code: 'BENG',
        level: DegreeLevel.BACHELORS, 
        description: 'Undergraduate degree in engineering' 
      },
      { 
        name: 'Master of Engineering', 
        code: 'MENG',
        level: DegreeLevel.MASTERS, 
        description: 'Graduate degree in engineering' 
      },
      { 
        name: 'Doctor of Medicine', 
        code: 'MD',
        level: DegreeLevel.PHD, 
        description: 'Professional doctoral degree for physicians' 
      }
    ];

    let created = 0;
    for (const degree of degrees) {
      const exists = await repository.findOneBy({ name: degree.name });
      if (!exists) {
        const newDegree = repository.create(degree);
        await repository.save(newDegree);
        created++;
      }
    }

    return {
      entity: 'Degree',
      count: created
    };
  }
}
