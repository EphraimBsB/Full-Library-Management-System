import { DataSource } from 'typeorm';
import { ISeeder, SeedResult } from '../base-seed.interface';
import { Source } from '../../../sys-configs/sources/entities/source.entity';

export class SourcesSeed implements ISeeder {
  public async run(dataSource: DataSource): Promise<SeedResult> {
    console.log('Seeding sources...');
    const repository = dataSource.getRepository(Source);
    
    const sources = [
      { 
        name: 'Publisher Direct', 
        supplier: 'Various Publishers', 
        dateAcquired: new Date('2023-01-15') 
      },
      { 
        name: 'Book Fair', 
        supplier: 'International Book Fair 2023', 
        dateAcquired: new Date('2023-03-20') 
      },
      { 
        name: 'Donation', 
        supplier: 'Alumni Association', 
        dateAcquired: new Date('2023-02-10') 
      },
      { 
        name: 'Online Retailer', 
        supplier: 'Amazon Books', 
        dateAcquired: new Date('2023-04-05') 
      },
      { 
        name: 'Auction', 
        supplier: 'Library Clearance Auction', 
        dateAcquired: new Date('2023-01-30') 
      }
    ];

    let created = 0;
    for (const source of sources) {
      const exists = await repository.findOneBy({ name: source.name });
      if (!exists) {
        const newSource = repository.create(source);
        await repository.save(newSource);
        created++;
      }
    }

    return {
      entity: 'Source',
      count: created
    };
  }
}
