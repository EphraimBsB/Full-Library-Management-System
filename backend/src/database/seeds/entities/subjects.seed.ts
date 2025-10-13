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
      // Mathematics & Statistics
      { name: 'Algebra', category: 'Mathematics', description: 'Study of mathematical symbols and rules for manipulating these symbols' },
      { name: 'Calculus', category: 'Mathematics', description: 'Mathematical study of continuous change' },
      { name: 'Statistics', category: 'Mathematics', description: 'Study of data collection, analysis, and interpretation' },
      { name: 'Discrete Mathematics', category: 'Mathematics', description: 'Study of mathematical structures that are fundamentally discrete' },
      { name: 'Linear Algebra', category: 'Mathematics', description: 'Study of vectors, vector spaces, and linear mappings' },
      
      // Physical Sciences
      { name: 'Classical Mechanics', category: 'Physics', description: 'Study of motion of bodies under the action of forces' },
      { name: 'Quantum Physics', category: 'Physics', description: 'Study of matter and energy at the smallest scales' },
      { name: 'Thermodynamics', category: 'Physics', description: 'Study of heat, work, and energy transfer' },
      { name: 'Electromagnetism', category: 'Physics', description: 'Study of electromagnetic force and fields' },
      { name: 'Astrophysics', category: 'Physics', description: 'Study of celestial objects and phenomena' },
      
      // Life Sciences
      { name: 'Genetics', category: 'Biology', description: 'Study of genes, genetic variation, and heredity' },
      { name: 'Microbiology', category: 'Biology', description: 'Study of microscopic organisms' },
      { name: 'Ecology', category: 'Biology', description: 'Study of organisms and their environment' },
      { name: 'Neuroscience', category: 'Biology', description: 'Scientific study of the nervous system' },
      { name: 'Biochemistry', category: 'Biology', description: 'Study of chemical processes within living organisms' },
      
      // Computer Science
      { name: 'Algorithms', category: 'Computer Science', description: 'Study of step-by-step procedures for calculations' },
      { name: 'Data Structures', category: 'Computer Science', description: 'Study of organizing and storing data' },
      { name: 'Artificial Intelligence', category: 'Computer Science', description: 'Development of intelligent machines' },
      { name: 'Computer networks', category: 'Computer Science', description: 'Study of communication between computers' },
      { name: 'Database Systems', category: 'Computer Science', description: 'Study of database management systems' },
      
      // Engineering
      { name: 'Electrical Engineering', category: 'Engineering', description: 'Study of electricity and electronics' },
      { name: 'Mechanical Engineering', category: 'Engineering', description: 'Study of mechanical systems' },
      { name: 'Civil Engineering', category: 'Engineering', description: 'Design and construction of infrastructure' },
      { name: 'Chemical Engineering', category: 'Engineering', description: 'Application of chemistry to industrial processes' },
      { name: 'Biomedical Engineering', category: 'Engineering', description: 'Application of engineering principles to medicine' },
      
      // Humanities
      { name: 'African History', category: 'History', description: 'Study of African historical events and societies' },
      { name: 'World History', category: 'History', description: 'Study of global historical events' },
      { name: 'Political Science', category: 'Social Sciences', description: 'Study of politics and political systems' },
      { name: 'Sociology', category: 'Social Sciences', description: 'Study of human society and social behavior' },
      { name: 'Anthropology', category: 'Social Sciences', description: 'Study of human societies and cultures' },
      
      // Business & Economics
      { name: 'Microeconomics', category: 'Economics', description: 'Study of individual economic behavior' },
      { name: 'Macroeconomics', category: 'Economics', description: 'Study of economy-wide phenomena' },
      { name: 'Financial Accounting', category: 'Business', description: 'Recording and reporting financial transactions' },
      { name: 'Marketing', category: 'Business', description: 'Process of promoting and selling products' },
      { name: 'Entrepreneurship', category: 'Business', description: 'Process of designing and running a new business' },
      
      // Languages & Literatures
      { name: 'English Literature', category: 'Literature', description: 'Study of literature written in English' },
      { name: 'African Literatures', category: 'Literature', description: 'Literature from the African continent' },
      { name: 'Linguistics', category: 'Languages', description: 'Scientific study of language' },
      { name: 'French', category: 'Languages', description: 'Study of the French language' },
      { name: 'Swahili', category: 'Languages', description: 'Study of the Swahili language' },
      
      // Law & Politics
      { name: 'Constitutional Law', category: 'Law', description: 'Study of fundamental principles of governance' },
      { name: 'International Law', category: 'Law', description: 'Laws governing relations between nations' },
      { name: 'Human Rights Law', category: 'Law', description: 'Laws concerning basic human rights' },
      { name: 'Comparative Politics', category: 'Political Science', description: 'Comparison of different political systems' },
      { name: 'Public Administration', category: 'Political Science', description: 'Implementation of government policy' },
      
      // Health Sciences
      { name: 'Anatomy', category: 'Medicine', description: 'Study of the structure of organisms' },
      { name: 'Physiology', category: 'Medicine', description: 'Study of normal functions of living organisms' },
      { name: 'Pharmacology', category: 'Medicine', description: 'Study of drug action' },
      { name: 'Public Health', category: 'Medicine', description: 'Prevention of disease and health promotion' },
      { name: 'Nutrition', category: 'Health Sciences', description: 'Study of nutrients in food' }
    ];

    const results: string[] = [];
    let created = 0;
    
    for (const subject of subjects) {
      try {
        const existingSubject = await repository.findOneBy({ name: subject.name });
        
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
        results.push(`Error processing subject ${subject.name}: ${error.message}`);
      }
    }

    console.log(results.join('\n'));
    return {
      entity: 'Subject',
      count: created
    };
  }
}
