import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Degree } from './entities/degree.entity';
import { CreateDegreeDto } from './dto/create-degree.dto';
import { UpdateDegreeDto } from './dto/update-degree.dto';

@Injectable()
export class DegreesService {
  constructor(
    @InjectRepository(Degree)
    private readonly degreeRepository: Repository<Degree>,
  ) {}

  async create(createDegreeDto: CreateDegreeDto): Promise<Degree> {
    const degree = this.degreeRepository.create(createDegreeDto);
    return await this.degreeRepository.save(degree);
  }

  async findAll(): Promise<Degree[]> {
    return await this.degreeRepository.find();
  }

  async findOne(id: number): Promise<Degree> {
    const degree = await this.degreeRepository.findOne({
      where: { id }
    });
    if (!degree) {
      throw new NotFoundException(`Degree with ID ${id} not found`);
    }
    return degree;
  }

  async findByName(name: string): Promise<Degree | null> {
    const degree = await this.degreeRepository.findOne({ where: { name } });
    return degree ?? null;
  }

  async update(id: number, updateDegreeDto: UpdateDegreeDto): Promise<Degree> {
    const degree = await this.findOne(id);
    Object.assign(degree, updateDegreeDto);
    return await this.degreeRepository.save(degree);
  }

  async remove(id: number): Promise<void> {
    const result = await this.degreeRepository.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException(`Degree with ID ${id} not found`);
    }
  }
}
