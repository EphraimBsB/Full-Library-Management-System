import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { CreateTypeDto } from './dto/create-type.dto';
import { UpdateTypeDto } from './dto/update-type.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Type } from './entities/type.entity';

@Injectable()
export class TypesService {
  constructor(
      @InjectRepository(Type)
      private readonly typeRepository: Repository<Type>,
    ) {}
  
    async create(createTypeDto: CreateTypeDto): Promise<Type> {
      // Check if a book type with the same name already exists
      const existingType = await this.typeRepository.findOne({
        where: { name: createTypeDto.name },
      });
  
      if (existingType) {
        throw new ConflictException(
          `A type with the name '${createTypeDto.name}' already exists`,
        );
      }
  
      const type = this.typeRepository.create(createTypeDto);
      return await this.typeRepository.save(type);
    }
  
    async findAll(): Promise<Type[]> {
      return await this.typeRepository.find({
        order: { name: 'ASC' },
      });
    }
  
    async findOne(id: number): Promise<Type> {
      const type = await this.typeRepository.findOne({
        where: { id },
      });
      
      if (!type) {
        throw new NotFoundException(`Type with ID ${id} not found`);
      }
      
      return type;
    }
  
    async findByName(name: string): Promise<Type | null> {
      return await this.typeRepository.findOne({ 
        where: { name },
        relations: ['books'],
      });
    }
  
    async update(
      id: number,
      updateTypeDto: UpdateTypeDto,
    ): Promise<Type> {
      const type = await this.findOne(id);
      
      // If name is being updated, check for duplicates
      if (updateTypeDto.name && updateTypeDto.name !== type.name) {
        const existingType = await this.typeRepository.findOne({
          where: { name: updateTypeDto.name },
        });
        
        if (existingType) {
          throw new ConflictException(
            `A type with the name '${updateTypeDto.name}' already exists`,
          );
        }
      }
      
      Object.assign(type, updateTypeDto);
      return await this.typeRepository.save(type);
    }
  
    async remove(id: number): Promise<void> {
      const type = await this.typeRepository.findOne({
        where: { id },
        relations: ['books'],
      });
  
      if (!type) {
        throw new NotFoundException(`Type with ID ${id} not found`);
      }
  
      if (type.books && type.books.length > 0) {
        throw new ConflictException(
          'Cannot delete type that has associated books',
        );
      }
  
      await this.typeRepository.remove(type);
    }
}
