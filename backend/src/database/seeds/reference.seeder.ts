import { DataSource, QueryRunner } from 'typeorm';
import { Category } from '../../books/entities/category.entity';
import { Subject } from '../../books/entities/subject.entity';

export class ReferenceSeeder {
  constructor(private dataSource: DataSource) {}

  async seed(queryRunner: QueryRunner): Promise<{ categories: Category[]; subjects: Subject[] }> {
    // Reset auto-increment counters
    await queryRunner.query('ALTER TABLE categories AUTO_INCREMENT = 1');
    await queryRunner.query('ALTER TABLE subjects AUTO_INCREMENT = 1');

    // Seed categories
    const categories = await this.dataSource.getRepository(Category).save([
      { name: 'Fiction', description: 'Imaginative works of literature' },
      { name: 'Non-Fiction', description: 'Factual works of literature' },
      { name: 'Science', description: 'Scientific works and research' },
      { name: 'History', description: 'Historical accounts and analysis' },
      { name: 'Technology', description: 'Technical and computing literature' },
      { name: 'Biography', description: 'Accounts of people\'s lives' },
      { name: 'Self-Help', description: 'Books for personal development' },
      { name: 'Business', description: 'Business and management literature' },
    ]);

    // Seed subjects
    const subjects = await this.dataSource.getRepository(Subject).save([
      { name: 'Computer Science', description: 'Study of computers and computing' },
      { name: 'Mathematics', description: 'Study of numbers, quantities, and shapes' },
      { name: 'Physics', description: 'Study of matter, energy, and their interactions' },
      { name: 'Literature', description: 'Study of written works' },
      { name: 'Philosophy', description: 'Study of fundamental questions' },
      { name: 'Economics', description: 'Study of production, consumption, and wealth' },
      { name: 'Psychology', description: 'Study of the mind and behavior' },
      { name: 'Engineering', description: 'Application of science to solve problems' },
    ]);

    console.log(`✅ Seeded ${categories.length} categories and ${subjects.length} subjects`);
    return { categories, subjects };
  }
}
