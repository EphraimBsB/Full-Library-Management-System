import { BadRequestException, ConflictException, Injectable, NotFoundException, Inject } from '@nestjs/common';
import { CreateSubjectDto } from './dto/create-subject.dto';
import { UpdateSubjectDto } from './dto/update-subject.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { PaginationOptions, PaginatedResponseDto } from 'src/common';
import { Repository, Not } from 'typeorm';
import { Subject } from './entities/subject.entity';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import type { Cache } from 'cache-manager';

@Injectable()
export class SubjectsService {
  constructor(
      @InjectRepository(Subject)
      private readonly subjectRepository: Repository<Subject>,
      @Inject(CACHE_MANAGER)
      private readonly cacheManager: Cache,
    ) {}

    private async resetCache(): Promise<void> {
    const store: any = (this.cacheManager as any).store;
    if (store && typeof store.reset === 'function') {
      await store.reset();
    }
  }

  private getSubjectsListCacheKey(options: {
    page: number;
    limit: number;
    search?: string;
  }): string {
    return `subjects:list:${JSON.stringify(options)}`;
  }
  
    async create(createSubjectDto: CreateSubjectDto): Promise<Subject> {
      // Check if subject with the same name already exists
      const existingSubject = await this.subjectRepository.findOne({
        where: {
          name: createSubjectDto.name,
        }
      });
  
      if (existingSubject) {
        throw new ConflictException('A subject with this name already exists');
      }
  
      const subject = this.subjectRepository.create(createSubjectDto);
      const saved = await this.subjectRepository.save(subject);
      await this.resetCache();
      return saved;
    }
  
    async findAll({
      page = 1,
      limit = 10,
      search,
    }: PaginationOptions): Promise<Subject[]> {
      const cacheKey = this.getSubjectsListCacheKey({ page, limit, search });

      // Check cache first
      const cachedData = await this.cacheManager.get<Subject[]>(cacheKey);
      if (cachedData) {
        return cachedData;
      }

      const skip = (page - 1) * limit;
      const queryBuilder = this.subjectRepository
        .createQueryBuilder('subject');
  
      if (search) {
        queryBuilder.andWhere('subject.name LIKE :search', { 
          search: `%${search}%` 
        });
      }
  
      const [data, total] = await queryBuilder
        .orderBy('subject.name', 'ASC')
        .getManyAndCount();
  
      // Cache the result for 60 seconds
      await this.cacheManager.set(cacheKey, data, 60);
      return data;
    }
  
    async findOne(id: number): Promise<Subject> {
      const subject = await this.subjectRepository.findOne({
        where: {
          id,
        },
        relations: ['books']
      });
  
      if (!subject) {
        throw new NotFoundException(`Subject with ID ${id} not found`);
      }
  
      return subject;
    }
  
    async update(
      id: number,
      updateSubjectDto: UpdateSubjectDto,
    ): Promise<Subject> {
      const subject = await this.findOne(id);
      
      // If name is being updated, check for conflicts
      if (updateSubjectDto.name && updateSubjectDto.name !== subject.name) {
        const existingSubject = await this.subjectRepository.findOne({
          where: { 
            name: updateSubjectDto.name, 
            id: Not(id),
          },
        });
  
        if (existingSubject) {
          throw new ConflictException('A subject with this name already exists');
        }
      }
  
      Object.assign(subject, updateSubjectDto);
      const saved = await this.subjectRepository.save(subject);
      await this.resetCache();
      return saved;
    }
  
    async remove(id: number): Promise<void> {
      const subject = await this.subjectRepository.findOne({
        where: {
          id,
        },
        relations: ['books']
      });
  
      if (!subject) {
        throw new NotFoundException(`Subject with ID ${id} not found`);
      }
  
      // Check if subject has associated books
      if (subject.books && subject.books.length > 0) {
        throw new BadRequestException(
          'Cannot delete subject with associated books. Please remove all books from this subject first.',
        );
      }
  
      await this.subjectRepository.softRemove(subject);
      await this.resetCache();
    }
  
    async countBooks(id: number): Promise<number> {
      const subject = await this.subjectRepository.findOne({
        where: {
          id,
        },
      });
  
      if (!subject) {
        throw new NotFoundException(`Subject with ID ${id} not found`);
      }
  
      return subject.books.length;
    }
  
    async findBooksBySubject(
      id: number,
      { page = 1, limit = 10 }: PaginationOptions,
    ): Promise<PaginatedResponseDto<any>> {
      const skip = (page - 1) * limit;
      
      const subject = await this.subjectRepository.findOne({
        where: {
          id,
        },
        relations: ['books']
      });
  
      if (!subject) {
        throw new NotFoundException(`Subject with ID ${id} not found`);
      }
  
      const [data, total] = await this.subjectRepository
        .createQueryBuilder('subject')
        .leftJoinAndSelect('subject.books', 'book')
        .where('subject.id = :id', { id })
        .select(['subject', 'book'])
        .skip(skip)
        .take(limit)
        .getManyAndCount();
  
      const totalPages = Math.ceil(total / limit);
      
      return new PaginatedResponseDto({
        data: data[0]?.books || [],
        total,
        page,
        limit,
        totalPages,
        hasPreviousPage: page > 1,
        hasNextPage: page < totalPages,
      });
    }
}
