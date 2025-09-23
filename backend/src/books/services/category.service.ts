import { 
  Injectable, 
  NotFoundException, 
  ConflictException, 
  BadRequestException 
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like, IsNull, Not } from 'typeorm';
import { PaginationOptions } from '../../common/interfaces/pagination-options.interface';
import { Category } from '../entities/category.entity';
import { CreateCategoryDto, UpdateCategoryDto } from '../dto/category.dto';
import { PaginatedResponseDto } from '../../common/dto/paginated-response.dto';

@Injectable()
export class CategoryService {
  constructor(
    @InjectRepository(Category)
    private readonly categoryRepository: Repository<Category>,
  ) {}

  async create(createCategoryDto: CreateCategoryDto): Promise<Category> {
    // Check if category with the same name already exists
    const existingCategory = await this.categoryRepository.findOne({
      where: { name: createCategoryDto.name, deletedAt: IsNull() },
    });

    if (existingCategory) {
      throw new ConflictException('A category with this name already exists');
    }

    const category = this.categoryRepository.create(createCategoryDto);
    return this.categoryRepository.save(category);
  }

  async findAll({
    page = 1,
    limit = 10,
    search,
  }: PaginationOptions): Promise<PaginatedResponseDto<Category>> {
    const skip = (page - 1) * limit;
    const queryBuilder = this.categoryRepository
      .createQueryBuilder('category')
      .where('category.deletedAt IS NULL');

    if (search) {
      queryBuilder.andWhere('category.name LIKE :search', { 
        search: `%${search}%` 
      });
    }

    const [data, total] = await queryBuilder
      .orderBy('category.name', 'ASC')
      .skip(skip)
      .take(limit)
      .getManyAndCount();

    const totalPages = Math.ceil(total / limit);
    
    return new PaginatedResponseDto({
      data,
      total,
      page,
      limit,
      totalPages,
      hasPreviousPage: page > 1,
      hasNextPage: page < totalPages,
    });
  }

  async findOne(id: number): Promise<Category> {
    const category = await this.categoryRepository.findOne({
      where: { id, deletedAt: IsNull() },
      relations: ['books'],
    });

    if (!category) {
      throw new NotFoundException(`Category with ID ${id} not found`);
    }

    return category;
  }

  async update(
    id: number,
    updateCategoryDto: UpdateCategoryDto,
  ): Promise<Category> {
    const category = await this.findOne(id);
    
    // If name is being updated, check for conflicts
    if (updateCategoryDto.name && updateCategoryDto.name !== category.name) {
      const existingCategory = await this.categoryRepository.findOne({
        where: { 
          name: updateCategoryDto.name, 
          id: Not(id),
          deletedAt: IsNull() 
        },
      });

      if (existingCategory) {
        throw new ConflictException('A category with this name already exists');
      }
    }

    Object.assign(category, updateCategoryDto);
    return this.categoryRepository.save(category);
  }

  async countBooks(id: number): Promise<number> {
    const category = await this.categoryRepository.findOne({
      where: { id },
      relations: ['books'],
    });

    if (!category) {
      throw new NotFoundException(`Category with ID ${id} not found`);
    }

    return category.books.length;
  }

  async remove(id: number): Promise<void> {
    const category = await this.categoryRepository.findOne({
      where: { id },
      relations: ['books'],
    });

    if (!category) {
      throw new NotFoundException(`Category with ID ${id} not found`);
    }

    // Check if category has associated books
    if (category.books && category.books.length > 0) {
      throw new BadRequestException(
        'Cannot delete category with associated books. Please remove all books from this category first.',
      );
    }

    await this.categoryRepository.softRemove(category);
  }

  async findBooksByCategory(
    id: number,
    { page = 1, limit = 10 }: PaginationOptions,
  ): Promise<PaginatedResponseDto<any>> {
    const skip = (page - 1) * limit;
    
    const category = await this.categoryRepository.findOne({
      where: { id, deletedAt: IsNull() },
      relations: ['books'],
    });

    if (!category) {
      throw new NotFoundException(`Category with ID ${id} not found`);
    }

    const [data, total] = await this.categoryRepository
      .createQueryBuilder('category')
      .leftJoinAndSelect('category.books', 'book')
      .where('category.id = :id', { id })
      .andWhere('book.deletedAt IS NULL')
      .select(['category', 'book'])
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
