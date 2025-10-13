import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateSourceDto } from './dto/create-source.dto';
import { UpdateSourceDto } from './dto/update-source.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Source } from './entities/source.entity';
import { Repository } from 'typeorm';

@Injectable()
export class SourcesService {
  constructor(
      @InjectRepository(Source)
      private readonly sourceRepository: Repository<Source>,
    ) {}
  
    async create(createSourceDto: CreateSourceDto): Promise<Source> {
      const source = this.sourceRepository.create(createSourceDto);
      return await this.sourceRepository.save(source);
    }
  
    async findAll(): Promise<Source[]> {
      return await this.sourceRepository.find();
    }
  
    async findOne(id: number): Promise<Source> {
      const source = await this.sourceRepository.findOne({
        where: { id: id },
      });
      if (!source) {
        throw new NotFoundException(`Source with ID ${id} not found`);
      }
      return source;
    }
  
    async findByName(name: string): Promise<Source | null> {
      return await this.sourceRepository.findOne({ 
        where: { name },
        relations: ['books'],
      });
    }
  
    async update(
      id: number,
      updateSourceDto: UpdateSourceDto,
    ): Promise<Source> {
      const source = await this.findOne(id);
      Object.assign(source, updateSourceDto);
      return await this.sourceRepository.save(source);
    }
  
    async remove(id: number): Promise<void> {
      const result = await this.sourceRepository.softDelete(id);
      if (result.affected === 0) {
        throw new NotFoundException(`Source with ID ${id} not found`);
      }
    }
}
