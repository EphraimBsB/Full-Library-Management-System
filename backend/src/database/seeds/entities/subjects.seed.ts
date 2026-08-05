import { DataSource } from 'typeorm';
import { ISeeder, SeedResult } from '../base-seed.interface';
import { Subject } from '../../../sys-configs/subjects/entities/subject.entity';

interface SubjectData {
  name: string;
  description: string;
  category?: string;
}

export class SubjectsSeed implements ISeeder {
  public async run(dataSource: DataSource): Promise<SeedResult> {
    console.log('Seeding subjects...');
    const repository = dataSource.getRepository(Subject);

    const subjects: SubjectData[] = [
      // Management & Business
      {
        name: 'MANAGEMENT',
        category: 'Business',
        description: 'Study of business management principles and practices',
      },
      {
        name: 'RESEARCH',
        category: 'Business',
        description: 'Study of research methodologies and business analysis',
      },
      {
        name: 'ADVERTISING',
        category: 'Business',
        description:
          'Study of advertising strategies and promotional techniques',
      },
      {
        name: 'MARKETING',
        category: 'Business',
        description: 'Study of marketing principles and customer engagement',
      },
      {
        name: 'COMMERCE',
        category: 'Business',
        description: 'Study of commercial activities and trade',
      },
      {
        name: 'ECONOMICS',
        category: 'Business',
        description: 'Study of economic principles and market behavior',
      },
      {
        name: 'FINANCE',
        category: 'Business',
        description: 'Study of financial management and investment strategies',
      },
      {
        name: 'ACCOUNTING',
        category: 'Business',
        description: 'Study of financial recording and reporting',
      },
      {
        name: 'HUMAN RESOURCE',
        category: 'Business',
        description:
          'Study of human resource management and personnel development',
      },
      {
        name: 'PRODUCTION MANAGEMENT',
        category: 'Business',
        description: 'Study of production planning and operational management',
      },
      {
        name: 'HOTEL MANAGEMENT',
        category: 'Business',
        description: 'Study of hospitality and hotel administration',
      },
      {
        name: 'BUSINESS ETHICS',
        category: 'Business',
        description: 'Study of ethical principles in business practices',
      },
      {
        name: 'INVESTMENT',
        category: 'Business',
        description: 'Study of investment strategies and portfolio management',
      },
      {
        name: 'SECURITY ANALYSIS',
        category: 'Business',
        description: 'Study of financial securities and market analysis',
      },
      {
        name: 'MICROECONOMICS',
        category: 'Business',
        description: 'Study of individual economic behavior and markets',
      },
      {
        name: 'BUSINESS ECONOMICS',
        category: 'Business',
        description: 'Study of economic principles applied to business',
      },
      {
        name: 'BUSINESS COMMUNICATION',
        category: 'Business',
        description: 'Study of communication in business contexts',
      },
      {
        name: 'PRODUCTION & OPERATIONS',
        category: 'Business',
        description: 'Study of production systems and operational efficiency',
      },
      {
        name: 'FINANCIAL ACCOUNTING',
        category: 'Business',
        description: 'Study of financial reporting and analysis',
      },
      {
        name: 'INTERNATIONAL BUSINESS',
        category: 'Business',
        description: 'Study of global business operations and trade',
      },
      {
        name: 'BUSINESS RESEARCH METHODS',
        category: 'Business',
        description: 'Study of research techniques for business analysis',
      },
      {
        name: 'ENTREPRENEURSHIP',
        category: 'Business',
        description: 'Study of entrepreneurship and new venture creation',
      },
      {
        name: 'ADVERTISING MANAGEMENT',
        category: 'Business',
        description: 'Study of managing advertising campaigns and strategies',
      },
      {
        name: 'TAXATION',
        category: 'Business',
        description: 'Study of tax systems and compliance',
      },
      {
        name: 'COST ACCOUNTING',
        category: 'Business',
        description: 'Study of cost analysis and management accounting',
      },
      {
        name: 'MANAGEMENT ACCOUNTING',
        category: 'Business',
        description: 'Study of accounting for managerial decision-making',
      },

      // Computer Science & Technology
      {
        name: 'CYBER SECURITY',
        category: 'Technology',
        description: 'Study of cybersecurity principles and network protection',
      },
      {
        name: 'ARTIFICIAL INTELLIGENCE',
        category: 'Technology',
        description: 'Study of AI systems and machine learning',
      },
      {
        name: 'DATABASE MANAGEMENT',
        category: 'Technology',
        description: 'Study of database design and administration',
      },
      {
        name: 'JAVA PROGRAMING',
        category: 'Technology',
        description: 'Study of Java programming language and development',
      },
      {
        name: 'COMPUTER',
        category: 'Technology',
        description: 'Study of computer fundamentals and applications',
      },
      {
        name: 'OPERATING SYSTEMS',
        category: 'Technology',
        description: 'Study of operating system design and management',
      },
      {
        name: 'COMPUTER SECURITY',
        category: 'Technology',
        description: 'Study of computer security and protection systems',
      },
      {
        name: 'COMPUTER APPLICATIONS',
        category: 'Technology',
        description: 'Study of computer applications and software usage',
      },

      // Engineering
      {
        name: 'ENGINEERING',
        category: 'Engineering',
        description: 'Study of engineering principles and applications',
      },

      // Social Sciences & Law
      {
        name: 'POLITICAL SCIENCE',
        category: 'Social Sciences',
        description: 'Study of political systems and governance',
      },
      {
        name: 'LAW',
        category: 'Social Sciences',
        description: 'Study of legal systems and jurisprudence',
      },

      // Languages & Communication
      {
        name: 'ENGLISH LANGUAGE',
        category: 'Languages',
        description: 'Study of English language and literature',
      },
      {
        name: 'COMMUNICATION SKILLS',
        category: 'Languages',
        description: 'Study of effective communication techniques',
      },
      {
        name: 'LITERATURE',
        category: 'Languages',
        description: 'Study of literary works and analysis',
      },

      // Mathematics & Statistics
      {
        name: 'MATHEMATICS',
        category: 'Sciences',
        description: 'Study of mathematical concepts and applications',
      },
      {
        name: 'STATISTICS',
        category: 'Sciences',
        description: 'Study of statistical analysis and data interpretation',
      },
    ];

    const results: string[] = [];
    let created = 0;

    for (const subject of subjects) {
      try {
        const existingSubject = await repository.findOneBy({
          name: subject.name,
        });

        if (!existingSubject) {
          const newSubject = repository.create({
            name: subject.name,
            description: subject.description,
            // The category field is just for organization in this seed file
            // The actual category relationship would need to be handled separately
          });
          await repository.save(newSubject);
          created++;
          results.push(`Created subject: ${subject.name}`);
        } else {
          // Update existing subject if description changed
          if (existingSubject.description !== subject.description) {
            existingSubject.description = subject.description;
            await repository.save(existingSubject);
            results.push(`Updated subject: ${subject.name}`);
          } else {
            results.push(`Subject already exists: ${subject.name}`);
          }
        }
      } catch (error) {
        results.push(
          `Error processing subject ${subject.name}: ${error.message}`,
        );
      }
    }

    console.log(results.join('\n'));
    return {
      entity: 'Subject',
      count: created,
    };
  }
}
