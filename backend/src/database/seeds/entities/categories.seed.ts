import { DataSource } from 'typeorm';
import { ISeeder, SeedResult } from '../base-seed.interface';
import { Category } from '../../../sys-configs/categories/entities/category.entity';

export class CategoriesSeed implements ISeeder {
  public async run(dataSource: DataSource): Promise<SeedResult> {
    console.log('Seeding categories...');
    const repository = dataSource.getRepository(Category);

    const categories = [
      {
        name: 'BUSINESS & COMMERCE',
        description: 'Books on business, commerce, finance, and management',
      },
      {
        name: 'ICT',
        description: 'Information and Communication Technology books and resources',
      },
      {
        name: 'HEALTH SCIENCE',
        description: 'Books on health sciences, medicine, and healthcare',
      },
      {
        name: 'ENGINEERING',
        description: 'Books on engineering principles and practices',
      },
      {
        name: 'GENERAL KNOWLEDGE',
        description: 'Books on general knowledge and reference materials',
      },
      {
        name: 'NATURAL SCIENCES',
        description: 'Books on natural sciences including physics, chemistry, and biology',
      },
    ];

    const results: string[] = [];
    let created = 0;

    for (const category of categories) {
      try {
        let existingCategory = await repository.findOneBy({
          name: category.name,
        });

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
        results.push(
          `Error processing category ${category.name}: ${error.message}`,
        );
      }
    }

    console.log(results.join('\n'));
    return {
      entity: 'Category',
      count: created,
    };
  }
}
