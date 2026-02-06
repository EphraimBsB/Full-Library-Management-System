import { DataSource } from 'typeorm';
import { ISeeder, SeedResult } from '../base-seed.interface';
import { Shelf } from '../../../sys-configs/shelves/entities/shelf.entity';
import { Location } from '../../../sys-configs/locations/entities/location.entity';

export class ShelvesSeed implements ISeeder {
  public async run(dataSource: DataSource): Promise<SeedResult> {
    console.log('Seeding shelves...');
    const repository = dataSource.getRepository(Shelf);
    const locationRepository = dataSource.getRepository(Location);

    // Get locations to reference
    const mainCampus = await locationRepository.findOne({
      where: { name: 'Main Campus Library' },
    });
    const cityCampus = await locationRepository.findOne({
      where: { name: 'City Campus Library' },
    });
    const scienceLibrary = await locationRepository.findOne({
      where: { name: 'Science & Technology Library' },
    });
    const medicalLibrary = await locationRepository.findOne({
      where: { name: 'Medical Campus Library' },
    });
    const distanceCenter = await locationRepository.findOne({
      where: { name: 'Distance Learning Center' },
    });

    const shelves = [
      {
        name: 'Shelf 1',
        description: 'ICT, Computer Science, Networking',
        locationId: mainCampus?.id ?? 1,
      },
      {
        name: 'Shelf 2',
        description: 'ICT, Computer Science, Networking',
        locationId: mainCampus?.id ?? 1,
      },
      {
        name: 'Shelf 3',
        description: 'Health Science, Engineering, statistics, Accounting, Management',
        locationId: mainCampus?.id ?? 1,
      },
      {
        name: 'Shelf 4',
        description: 'Business and Commerce',
        locationId: cityCampus?.id ?? 2,
      },
      {
        name: 'Shelf 5',
        description: 'Student Projects',
        locationId: mainCampus?.id ?? 1,
      },
    ];

    let created = 0;
    for (const shelf of shelves) {
      const exists = await repository.findOneBy({
        name: shelf.name,
        locationId: shelf.locationId,
      });
      if (!exists) {
        const newShelf = repository.create(shelf);
        await repository.save(newShelf);
        created++;
      }
    }

    return {
      entity: 'Shelf',
      count: created,
    };
  }
}
