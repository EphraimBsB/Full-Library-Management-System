import { DataSource } from 'typeorm';
import { ISeeder, SeedResult } from '../base-seed.interface';
import { Type, BookFormat } from '../../../sys-configs/types/entities/type.entity';

export class TypesSeed implements ISeeder {
  public async run(dataSource: DataSource): Promise<SeedResult> {
    console.log('Seeding book types...');
    const repository = dataSource.getRepository(Type);
    
    const types = [
      { 
        name: 'Hardcover', 
        format: BookFormat.PHYSICAL, 
        description: 'Hardcover book with dust jacket' 
      },
      { 
        name: 'Paperback', 
        format: BookFormat.PHYSICAL, 
        description: 'Softcover book' 
      },
      { 
        name: 'E-book', 
        format: BookFormat.DIGITAL, 
        description: 'Digital book format' 
      },
      { 
        name: 'Audiobook', 
        format: BookFormat.DIGITAL, 
        description: 'Audio version of the book' 
      },
      { 
        name: 'Reference', 
        format: BookFormat.PHYSICAL, 
        description: 'Reference materials' 
      },
      { 
        name: 'Textbook', 
        format: BookFormat.PHYSICAL, 
        description: 'Educational textbook' 
      },
      { 
        name: 'Periodical', 
        format: BookFormat.PHYSICAL, 
        description: 'Magazines and journals' 
      },
      { 
        name: 'Thesis', 
        format: BookFormat.DIGITAL, 
        description: 'Academic theses and dissertations' 
      },
      { 
        name: 'Rare Book', 
        format: BookFormat.PHYSICAL, 
        description: 'Rare and collectible books' 
      },
      { 
        name: 'Graphic Novel', 
        format: BookFormat.PHYSICAL, 
        description: 'Comics and graphic novels' 
      }
    ];

    let created = 0;
    for (const type of types) {
      const exists = await repository.findOneBy({ name: type.name });
      if (!exists) {
        const newType = repository.create(type);
        await repository.save(newType);
        created++;
      }
    }

    return {
      entity: 'Type',
      count: created
    };
  }
}
