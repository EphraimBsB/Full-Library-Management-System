import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Location } from '../locations/entities/location.entity';
import { CreateShelfDto } from './dto/create-shelf.dto';
import { UpdateShelfDto } from './dto/update-shelf.dto';
import { Shelf } from './entities/shelf.entity';

@Injectable()
export class ShelvesService {
  constructor(
    @InjectRepository(Shelf)
    private readonly shelfRepository: Repository<Shelf>,
    @InjectRepository(Location)
    private readonly locationRepository: Repository<Location>,
  ) {}

  private async ensureLocation(locationId: number): Promise<Location> {
    const location = await this.locationRepository.findOne({
      where: { id: locationId },
    });
    if (!location) {
      throw new NotFoundException(`Location with ID ${locationId} not found`);
    }
    return location;
  }

  async create(createShelfDto: CreateShelfDto): Promise<Shelf> {
    await this.ensureLocation(createShelfDto.locationId);

    const existing = await this.shelfRepository.findOne({
      where: {
        name: createShelfDto.name,
        locationId: createShelfDto.locationId,
      },
    });

    if (existing) {
      throw new ConflictException(
        `A shelf with the name '${createShelfDto.name}' already exists in this location`,
      );
    }

    const shelf = this.shelfRepository.create(createShelfDto);
    return await this.shelfRepository.save(shelf);
  }

  async findAll(): Promise<Shelf[]> {
    return await this.shelfRepository.find({ order: { name: 'ASC' } });
  }

  async findOne(id: number): Promise<Shelf> {
    const shelf = await this.shelfRepository.findOne({ where: { id } });
    if (!shelf) {
      throw new NotFoundException(`Shelf with ID ${id} not found`);
    }
    return shelf;
  }

  async toggleStatus(id: number): Promise<Shelf> {
    const shelf = await this.findOne(id);
    shelf.isActive = !shelf.isActive;
    return await this.shelfRepository.save(shelf);
  }

  async update(id: number, updateShelfDto: UpdateShelfDto): Promise<Shelf> {
    const shelf = await this.findOne(id);

    const nextLocationId = updateShelfDto.locationId ?? shelf.locationId;
    await this.ensureLocation(nextLocationId);

    const nextName = updateShelfDto.name ?? shelf.name;
    if (nextName !== shelf.name || nextLocationId !== shelf.locationId) {
      const existing = await this.shelfRepository.findOne({
        where: { name: nextName, locationId: nextLocationId },
      });
      if (existing && existing.id !== shelf.id) {
        throw new ConflictException(
          `A shelf with the name '${nextName}' already exists in this location`,
        );
      }
    }

    Object.assign(shelf, updateShelfDto);
    return await this.shelfRepository.save(shelf);
  }

  async remove(id: number): Promise<void> {
    const result = await this.shelfRepository.softDelete(id);
    if (result.affected === 0) {
      throw new NotFoundException(`Shelf with ID ${id} not found`);
    }
  }
}
