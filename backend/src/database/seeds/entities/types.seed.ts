import { DataSource } from 'typeorm';
import { ISeeder, SeedResult } from '../base-seed.interface';
import {
  Type,
  BookFormat,
} from '../../../sys-configs/types/entities/type.entity';

export class TypesSeed implements ISeeder {
  public async run(dataSource: DataSource): Promise<SeedResult> {
    console.log('Seeding book types...');
    const repository = dataSource.getRepository(Type);

    const types = [
      {
        name: 'Physical',
        format: BookFormat.PHYSICAL,
        description: 'Physical book with dust jacket',
      },
      {
        name: 'E-book',
        format: BookFormat.DIGITAL,
        description: 'Digital book format',
      },
      {
        name: 'Physical and E-book',
        format: BookFormat.BOTH,
        description: 'Physical and digital book format',
      },
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
      count: created,
    };
  }
}
