import { DataSource } from 'typeorm';
import { ISeeder, SeedResult } from '../base-seed.interface';
import { Publisher } from '../../../sys-configs/publishers/entities/publisher.entity';

export class PublishersSeed implements ISeeder {
  public async run(dataSource: DataSource): Promise<SeedResult> {
    console.log('Seeding publishers...');
    const repository = dataSource.getRepository(Publisher);

    const publishers = [
      {
        name: 'Pearson Education',
        description: 'Leading education publishing company',
        phone: '+1-800-922-0579',
        email: 'info@pearson.com',
        address: '221 River Street, Hoboken, NJ 07030, USA',
      },
      {
        name: 'Oxford University Press',
        description: "World's largest university press",
        phone: '+1-800-445-9714',
        email: 'customerservice@oup.com',
        address: '198 Madison Avenue, New York, NY 10016, USA',
      },
      {
        name: 'Cambridge University Press',
        description: 'Publishing house of the University of Cambridge',
        phone: '+1-845-353-7500',
        email: 'information@cambridge.org',
        address: '1 Liberty Plaza, Floor 20, New York, NY 10006, USA',
      },
      {
        name: 'McGraw-Hill Education',
        description: 'Educational publisher and learning science company',
        phone: '+1-800-338-3987',
        email: 'orders@mheducation.com',
        address: '1221 Avenue of the Americas, New York, NY 10020, USA',
      },
      {
        name: 'Wiley',
        description:
          'Global publishing company specializing in academic content',
        phone: '+1-201-748-8789',
        email: 'cs-journals@wiley.com',
        address: '111 River Street, Hoboken, NJ 07030, USA',
      },
    ];

    let created = 0;
    for (const publisher of publishers) {
      const exists = await repository.findOneBy({ name: publisher.name });
      if (!exists) {
        const newPublisher = repository.create(publisher);
        await repository.save(newPublisher);
        created++;
      }
    }

    return {
      entity: 'Publisher',
      count: created,
    };
  }
}
