import { DataSource } from 'typeorm';
import { ISeeder, SeedResult } from '../base-seed.interface';
import { Source } from '../../../sys-configs/sources/entities/source.entity';

export class SourcesSeed implements ISeeder {
  public async run(dataSource: DataSource): Promise<SeedResult> {
    console.log('Seeding sources...');
    const repository = dataSource.getRepository(Source);

    const sources = [
      {
        name: 'Purchased',
        supplier: 'Purchased from supplier',
        dateAcquired: new Date('2023-01-15'),
      },
      {
        name: 'Donation',
        supplier: 'Donated by donor',
        dateAcquired: new Date('2023-02-10'),
      },
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
      count: created,
    };
  }
}
