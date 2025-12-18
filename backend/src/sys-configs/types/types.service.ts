import { ConflictException, Injectable, NotFoundException, Inject } from '@nestjs/common';
import { CreateTypeDto } from './dto/create-type.dto';
import { UpdateTypeDto } from './dto/update-type.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Type } from './entities/type.entity';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import type { Cache } from 'cache-manager';

@Injectable()
export class TypesService {
  constructor(
      @InjectRepository(Type)
      private readonly typeRepository: Repository<Type>,
      @Inject(CACHE_MANAGER)
      private readonly cacheManager: Cache,
    ) {}

  private async resetCache(): Promise<void> {
    const store: any = (this.cacheManager as any).store;
    if (store && typeof store.reset === 'function') {
      await store.reset();
    }
  }

  private getTypesListCacheKey(): string {
    return 'types:list:all';
  }
  
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
      const saved = await this.typeRepository.save(type);
      await this.resetCache();
      return saved;
    }
  
    async findAll(): Promise<Type[]> {
      const cacheKey = this.getTypesListCacheKey();

      // Check cache first
      const cachedData = await this.cacheManager.get<Type[]>(cacheKey);
      if (cachedData) {
        return cachedData;
      }

      const types = await this.typeRepository.find({
        order: { name: 'ASC' },
      });

      // Cache the result for 60 seconds
      await this.cacheManager.set(cacheKey, types, 60);
      return types;
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
      const updated = await this.typeRepository.save(type);
      await this.resetCache();
      return updated;
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
      await this.resetCache();
    }
}
