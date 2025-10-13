import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { CreateSubjectDto } from './dto/create-subject.dto';
import { UpdateSubjectDto } from './dto/update-subject.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { PaginationOptions, PaginatedResponseDto } from 'src/common';
import { Repository, Not } from 'typeorm';
import { Subject } from './entities/subject.entity';

@Injectable()
export class SubjectsService {
  constructor(
      @InjectRepository(Subject)
      private readonly subjectRepository: Repository<Subject>,
    ) {}
  
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
      return this.subjectRepository.save(subject);
    }
  
    async findAll({
      page = 1,
      limit = 10,
      search,
    }: PaginationOptions): Promise<Subject[]> {
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
      return this.subjectRepository.save(subject);
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
