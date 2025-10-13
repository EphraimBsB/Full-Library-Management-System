import { DataSource } from 'typeorm';
import { ISeeder, SeedResult } from '../base-seed.interface';
import { Type } from 'src/sys-configs/types/entities/type.entity';

export class BookTypesSeed implements ISeeder {
  public async run(dataSource: DataSource): Promise<SeedResult> {
    console.log('Seeding book types...');
    const repository = dataSource.getRepository(Type);
    
    const bookTypes = [
      // Academic Book Types
      {
        name: 'Textbook',
        description: 'Comprehensive educational books used as standard works for formal study',
        loanDurationDays: 14,
        renewalLimit: 1,
        finePerDay: 100,
        canBeReserved: true,
        maxRenewalDays: 7
      },
      {
        name: 'Reference',
        description: 'Books meant to be consulted for specific information rather than read cover to cover',
        loanDurationDays: 7,
        renewalLimit: 0,
        finePerDay: 150,
        canBeReserved: false,
        maxRenewalDays: 0
      },
      {
        name: 'Research Monograph',
        description: 'Detailed written study of a single specialized subject',
        loanDurationDays: 21,
        renewalLimit: 2,
        finePerDay: 75,
        canBeReserved: true,
        maxRenewalDays: 14
      },
      
      // General Reading
      {
        name: 'Fiction',
        description: 'Imaginative works of prose',
        loanDurationDays: 14,
        renewalLimit: 2,
        finePerDay: 50,
        canBeReserved: true,
        maxRenewalDays: 14
      },
      {
        name: 'Non-Fiction',
        description: 'Factual works based on real events or information',
        loanDurationDays: 14,
        renewalLimit: 2,
        finePerDay: 50,
        canBeReserved: true,
        maxRenewalDays: 14
      },
      {
        name: 'Biography',
        description: 'Detailed description of a person\'s life',
        loanDurationDays: 14,
        renewalLimit: 1,
        finePerDay: 75,
        canBeReserved: true,
        maxRenewalDays: 7
      },
      
      // Special Collections
      {
        name: 'Rare Book',
        description: 'Valuable or scarce books that may have special handling requirements',
        loanDurationDays: 7,
        renewalLimit: 0,
        finePerDay: 500,
        canBeReserved: true,
        maxRenewalDays: 0,
        requiresSpecialHandling: true
      },
      {
        name: 'Thesis/Dissertation',
        description: 'Academic research papers submitted for higher education degrees',
        loanDurationDays: 14,
        renewalLimit: 1,
        finePerDay: 100,
        canBeReserved: true,
        maxRenewalDays: 7
      },
      
      // Media Types
      {
        name: 'Audiobook',
        description: 'Recorded book in digital or analog audio format',
        loanDurationDays: 14,
        renewalLimit: 1,
        finePerDay: 75,
        canBeReserved: true,
        maxRenewalDays: 7,
        isMedia: true
      },
      {
        name: 'E-book',
        description: 'Digital book available for online reading or download',
        loanDurationDays: 14,
        renewalLimit: 1,
        finePerDay: 50,
        canBeReserved: true,
        maxRenewalDays: 7,
        isDigital: true
      },
      
      // Periodicals
      {
        name: 'Journal',
        description: 'Academic or professional periodical publication',
        loanDurationDays: 7,
        renewalLimit: 0,
        finePerDay: 100,
        canBeReserved: false,
        maxRenewalDays: 0
      },
      {
        name: 'Magazine',
        description: 'Periodical publication containing articles and illustrations',
        loanDurationDays: 7,
        renewalLimit: 0,
        finePerDay: 50,
        canBeReserved: false,
        maxRenewalDays: 0
      },
      
      // Special Purpose
      {
        name: 'Course Reserve',
        description: 'Materials set aside for specific courses with limited loan periods',
        loanDurationDays: 2,
        renewalLimit: 0,
        finePerDay: 200,
        canBeReserved: false,
        maxRenewalDays: 0
      },
      {
        name: 'Open Shelf Reference',
        description: 'Reference materials that must be used within the library',
        loanDurationDays: 0,
        renewalLimit: 0,
        finePerDay: 0,
        canBeReserved: false,
        maxRenewalDays: 0,
        isForInLibraryUseOnly: true
      }
    ];

    const results: string[] = [];
    let created = 0;
    
    for (const type of bookTypes) {
      try {
        let existingType = await repository.findOneBy({ name: type.name });
        
        if (!existingType) {
          const newType = repository.create(type);
          await repository.save(newType);
          created++;
          results.push(`Created book type: ${type.name}`);
        } else {
          // Update existing type if any properties changed
          const needsUpdate = Object.keys(type).some(
            key => existingType[key] !== type[key]
          );
          
          if (needsUpdate) {
            Object.assign(existingType, type);
            await repository.save(existingType);
            results.push(`Updated book type: ${type.name}`);
          } else {
            results.push(`Book type already exists: ${type.name}`);
          }
        }
      } catch (error) {
        results.push(`Error processing book type ${type.name}: ${error.message}`);
      }
    }

    console.log(results.join('\n'));
    return {
      entity: 'BookType',
      count: created
    };
  }
}
