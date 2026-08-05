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
        description:
          'Global education company providing educational materials and technologies',
        phone: '+1-800-848-9500',
        email: 'info@pearson.com',
        address: '221 River Street, Hoboken, NJ 07030, USA',
      },
      {
        name: 'Macmillan Publishers',
        description:
          'International publishing company with academic and educational publications',
        phone: '+44-20-7833-6000',
        email: 'contact@macmillan.com',
        address: 'The Macmillan Campus, 4 Crinan Street, London N1 9XW, UK',
      },
      {
        name: 'Himalaya Publishers',
        description:
          'Educational publisher specializing in academic textbooks and reference materials',
        phone: '+91-11-4154-9000',
        email: 'info@himalayapublishers.com',
        address: 'Himalaya House, P-2, Nehru Place, New Delhi 110019, India',
      },
      {
        name: 'HarperCollins',
        description:
          'One of the largest English-language publishers in the world',
        phone: '+1-212-207-7000',
        email: 'harpercollins@harpercollins.com',
        address: '195 Broadway, New York, NY 10007, USA',
      },
      {
        name: 'Springer',
        description:
          'Leading global scientific publisher providing books and journals in science, technology and medicine',
        phone: '+1-212-460-1500',
        email: 'service@springernature.com',
        address: '233 Spring Street, New York, NY 10013, USA',
      },
      {
        name: 'Mcgraw Hill Education',
        description:
          'Learning science company providing customized educational content and software',
        phone: '+1-800-338-3987',
        email: 'customerservice@mheducation.com',
        address: '1221 Avenue of the Americas, New York, NY 10020, USA',
      },
      {
        name: 'Cengage',
        description:
          'Educational content, technology, and services company for the higher education market',
        phone: '+1-800-354-9706',
        email: 'support@cengage.com',
        address: '10650 Toebben Drive, Independence, KY 41051, USA',
      },
      {
        name: 'Emerald',
        description:
          'Global publisher linking research and practice to the benefit of society',
        phone: '+44-1274-785-277',
        email: 'emerald@emerald.com',
        address: 'Howard House, Wagon Lane, Bingley BD16 1WA, UK',
      },
      {
        name: 'Penguin',
        description:
          'British publishing house and imprint of Penguin Random House',
        phone: '+1-212-366-2000',
        email: 'press@penguinrandomhouse.com',
        address: '1745 Broadway, New York, NY 10019, USA',
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
