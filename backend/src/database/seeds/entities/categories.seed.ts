import { DataSource } from 'typeorm';
import { ISeeder, SeedResult } from '../base-seed.interface';
import { Category } from '../../../sys-configs/categories/entities/category.entity';

export class CategoriesSeed implements ISeeder {
  public async run(dataSource: DataSource): Promise<SeedResult> {
    console.log('Seeding categories...');
    const repository = dataSource.getRepository(Category);
    
    const categories = [
      // Academic Categories
      { name: 'Computer Science', description: 'Books on programming, algorithms, and computer systems' },
      { name: 'Mathematics', description: 'Textbooks and references on mathematical concepts and theories' },
      { name: 'Physics', description: 'Works on physics principles and discoveries' },
      { name: 'Chemistry', description: 'Books on chemical elements, compounds, and reactions' },
      { name: 'Biology', description: 'Literature on living organisms and life processes' },
      { name: 'Engineering', description: 'Technical books on various engineering disciplines' },
      { name: 'Business & Economics', description: 'Books on commerce, finance, and economic theories' },
      { name: 'Law', description: 'Legal texts, case studies, and references' },
      { name: 'Medicine', description: 'Medical textbooks and health-related literature' },
      { name: 'Education', description: 'Resources for teaching and learning methodologies' },
      
      // Literature & Fiction
      { name: 'Fiction', description: 'Imaginative works of prose' },
      { name: 'Classic Literature', description: 'Enduring works of literature' },
      { name: 'Poetry', description: 'Literary works that express feelings and ideas' },
      { name: 'Drama', description: 'Plays and theatrical works' },
      { name: 'Short Stories', description: 'Collections of short fiction' },
      
      // Non-Fiction
      { name: 'Biography', description: 'Life stories of notable individuals' },
      { name: 'History', description: 'Historical accounts and analysis' },
      { name: 'Science & Nature', description: 'Scientific works and natural world exploration' },
      { name: 'Self-Help', description: 'Books for personal development and improvement' },
      { name: 'Travel', description: 'Travel guides and travelogues' },
      
      // Technology
      { name: 'Programming', description: 'Books on coding and software development' },
      { name: 'Web Development', description: 'Resources for building web applications' },
      { name: 'Data Science', description: 'Books on data analysis and machine learning' },
      { name: 'Cybersecurity', description: 'Information security and ethical hacking' },
      { name: 'Mobile Development', description: 'Books on iOS and Android development' },
      
      // Reference
      { name: 'Dictionaries', description: 'Language and specialized dictionaries' },
      { name: 'Encyclopedias', description: 'Comprehensive reference works' },
      { name: 'Atlases', description: 'Collections of maps and geographical information' },
      { name: 'Manuals', description: 'Instructional and how-to guides' }
    ];

    const results: string[] = [];
    let created = 0;
    
    for (const category of categories) {
      try {
        let existingCategory = await repository.findOneBy({ name: category.name });
        
        if (!existingCategory) {
          const newCategory = repository.create(category);
          await repository.save(newCategory);
          created++;
          results.push(`Created category: ${category.name}`);
        } else {
          // Update existing category if description changed
          if (existingCategory.description !== category.description) {
            existingCategory.description = category.description;
            await repository.save(existingCategory);
            results.push(`Updated category: ${category.name}`);
          } else {
            results.push(`Category already exists: ${category.name}`);
          }
        }
      } catch (error) {
        results.push(`Error processing category ${category.name}: ${error.message}`);
      }
    }

    console.log(results.join('\n'));
    return {
      entity: 'Category',
      count: created
    };
  }
}
