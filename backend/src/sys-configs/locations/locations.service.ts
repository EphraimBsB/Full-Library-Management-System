import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateLocationDto } from './dto/create-location.dto';
import { UpdateLocationDto } from './dto/update-location.dto';
import { Location } from './entities/location.entity';

@Injectable()
export class LocationsService {
  constructor(
    @InjectRepository(Location)
    private readonly locationRepository: Repository<Location>,
  ) {}

  async create(createLocationDto: CreateLocationDto): Promise<Location> {
    const existing = await this.locationRepository.findOne({
      where: { name: createLocationDto.name },
    });

    if (existing) {
      throw new ConflictException(
        `A location with the name '${createLocationDto.name}' already exists`,
      );
    }

    const location = this.locationRepository.create(createLocationDto);
    return await this.locationRepository.save(location);
  }

  async findAll(): Promise<Location[]> {
    return await this.locationRepository.find({ order: { name: 'ASC' } });
  }

  async findOne(id: number): Promise<Location> {
    const location = await this.locationRepository.findOne({ where: { id } });
    if (!location) {
      throw new NotFoundException(`Location with ID ${id} not found`);
    }
    return location;
  }

  async toggleStatus(id: number): Promise<Location> {
    const location = await this.findOne(id);
    location.isActive = !location.isActive;
    return await this.locationRepository.save(location);
  }

  async update(id: number, updateLocationDto: UpdateLocationDto): Promise<Location> {
    const location = await this.findOne(id);

    if (updateLocationDto.name && updateLocationDto.name !== location.name) {
      const existing = await this.locationRepository.findOne({
        where: { name: updateLocationDto.name },
      });
      if (existing) {
        throw new ConflictException(
          `A location with the name '${updateLocationDto.name}' already exists`,
        );
      }
    }

    Object.assign(location, updateLocationDto);
    return await this.locationRepository.save(location);
  }

  async remove(id: number): Promise<void> {
    const result = await this.locationRepository.softDelete(id);
    if (result.affected === 0) {
      throw new NotFoundException(`Location with ID ${id} not found`);
    }
  }
}
