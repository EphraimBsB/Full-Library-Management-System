import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreatePublisherDto } from './dto/create-publisher.dto';
import { UpdatePublisherDto } from './dto/update-publisher.dto';
import { Publisher } from './entities/publisher.entity';

@Injectable()
export class PublishersService {
  constructor(
    @InjectRepository(Publisher)
    private readonly publisherRepository: Repository<Publisher>,
  ) {}

  async create(createPublisherDto: CreatePublisherDto): Promise<Publisher> {
    const existing = await this.publisherRepository.findOne({
      where: { name: createPublisherDto.name },
    });

    if (existing) {
      throw new ConflictException(
        `A publisher with the name '${createPublisherDto.name}' already exists`,
      );
    }

    const publisher = this.publisherRepository.create(createPublisherDto);
    return await this.publisherRepository.save(publisher);
  }

  async findAll(): Promise<Publisher[]> {
    return await this.publisherRepository.find({ order: { name: 'ASC' } });
  }

  async findOne(id: number): Promise<Publisher> {
    const publisher = await this.publisherRepository.findOne({ where: { id } });
    if (!publisher) {
      throw new NotFoundException(`Publisher with ID ${id} not found`);
    }
    return publisher;
  }

  async toggleStatus(id: number): Promise<Publisher> {
    const publisher = await this.findOne(id);
    publisher.isActive = !publisher.isActive;
    return await this.publisherRepository.save(publisher);
  }

  async update(
    id: number,
    updatePublisherDto: UpdatePublisherDto,
  ): Promise<Publisher> {
    const publisher = await this.findOne(id);

    if (updatePublisherDto.name && updatePublisherDto.name !== publisher.name) {
      const existing = await this.publisherRepository.findOne({
        where: { name: updatePublisherDto.name },
      });
      if (existing) {
        throw new ConflictException(
          `A publisher with the name '${updatePublisherDto.name}' already exists`,
        );
      }
    }

    Object.assign(publisher, updatePublisherDto);
    return await this.publisherRepository.save(publisher);
  }

  async remove(id: number): Promise<void> {
    const result = await this.publisherRepository.softDelete(id);
    if (result.affected === 0) {
      throw new NotFoundException(`Publisher with ID ${id} not found`);
    }
  }
}
