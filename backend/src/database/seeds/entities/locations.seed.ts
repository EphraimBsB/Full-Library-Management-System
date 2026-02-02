import { DataSource } from 'typeorm';
import { ISeeder, SeedResult } from '../base-seed.interface';
import { Location } from '../../../sys-configs/locations/entities/location.entity';

export class LocationsSeed implements ISeeder {
  public async run(dataSource: DataSource): Promise<SeedResult> {
    console.log('Seeding locations...');
    const repository = dataSource.getRepository(Location);

    const locations = [
      {
        name: 'Main Campus Library',
        description: 'Central library building with comprehensive collections',
        address: '123 University Avenue, Main Campus, Kampala, Uganda',
      },
      {
        name: 'City Campus Library',
        description: 'Downtown branch serving urban students and professionals',
        address: '456 City Center Plaza, Kampala, Uganda',
      },
    ];

    let created = 0;
    for (const location of locations) {
      const exists = await repository.findOneBy({ name: location.name });
      if (!exists) {
        const newLocation = repository.create(location);
        await repository.save(newLocation);
        created++;
      }
    }

    return {
      entity: 'Location',
      count: created,
    };
  }
}
