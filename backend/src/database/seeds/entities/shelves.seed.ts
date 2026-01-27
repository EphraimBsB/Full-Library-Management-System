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
        name: 'Reference Collection',
        description: 'Dictionaries, encyclopedias, and reference materials',
        locationId: mainCampus?.id ?? 1,
      },
      {
        name: 'General Fiction',
        description: 'Popular fiction and literature collection',
        locationId: mainCampus?.id ?? 1,
      },
      {
        name: 'Computer Science',
        description: 'Programming, algorithms, and software engineering books',
        locationId: scienceLibrary?.id ?? 3,
      },
      {
        name: 'Engineering',
        description: 'Civil, mechanical, and electrical engineering texts',
        locationId: scienceLibrary?.id ?? 3,
      },
      {
        name: 'Medical Reference',
        description: 'Medical textbooks and clinical references',
        locationId: medicalLibrary?.id ?? 4,
      },
      {
        name: 'Nursing Collection',
        description: 'Nursing textbooks and practice guides',
        locationId: medicalLibrary?.id ?? 4,
      },
      {
        name: 'Business & Economics',
        description: 'Business management, finance, and economics books',
        locationId: cityCampus?.id ?? 2,
      },
      {
        name: 'Periodicals',
        description: 'Journals, magazines, and newspapers',
        locationId: cityCampus?.id ?? 2,
      },
      {
        name: 'Digital Resources',
        description: 'E-books and online resource access terminals',
        locationId: distanceCenter?.id ?? 5,
      },
      {
        name: 'Study Materials',
        description: 'Course materials and study guides for distance learners',
        locationId: distanceCenter?.id ?? 5,
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
