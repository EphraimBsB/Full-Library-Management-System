import { BadRequestException, Injectable, Inject } from '@nestjs/common';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { IsNull, Not } from 'typeorm';
import { NotFoundException } from '@nestjs/common';
import { ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PaginationOptions, PaginatedResponseDto } from 'src/common';
import { Category } from './entities/category.entity';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import type { Cache } from 'cache-manager';

@Injectable()
export class CategoriesService {
  constructor(
    @InjectRepository(Category)
    private readonly categoryRepository: Repository<Category>,
    @Inject(CACHE_MANAGER)
    private readonly cacheManager: Cache,
  ) {}

  private async resetCache(): Promise<void> {
    const store: any = (this.cacheManager as any).store;
    if (store && typeof store.reset === 'function') {
      await store.reset();
    }
  }

  private getCategoriesListCacheKey(options: {
    page: number;
    limit: number;
    search?: string;
  }): string {
    return `categories:list:${JSON.stringify(options)}`;
  }

  async create(createCategoryDto: CreateCategoryDto): Promise<Category> {
    // Check if category with the same name already exists (not soft deleted)
    const existingCategory = await this.categoryRepository.findOne({
      where: { name: createCategoryDto.name, deletedAt: IsNull() },
    });

    if (existingCategory) {
      throw new ConflictException('A category with this name already exists');
    }

    // Check if there's a soft-deleted category with same name to restore
    const softDeletedCategory = await this.categoryRepository.findOne({
      where: { name: createCategoryDto.name, deletedAt: Not(IsNull()) },
    });

    if (softDeletedCategory) {
      // Restore the soft-deleted category
      softDeletedCategory.deletedAt = undefined;
      softDeletedCategory.description = createCategoryDto.description || softDeletedCategory.description;
      const restored = await this.categoryRepository.save(softDeletedCategory);
      await this.resetCache();
      return restored;
    }

    const category = this.categoryRepository.create(createCategoryDto);
    const saved = await this.categoryRepository.save(category);
    await this.resetCache();
    return saved;
  }

  async findAll({
    page = 1,
    limit = 10,
    search,
  }: PaginationOptions): Promise<Category[]> {
    const cacheKey = this.getCategoriesListCacheKey({ page, limit, search });

    // Check cache first
    const cachedData = await this.cacheManager.get<Category[]>(cacheKey);
    if (cachedData) {
      return cachedData;
    }

    // const skip = (page - 1) * limit;
    const queryBuilder = this.categoryRepository.createQueryBuilder('category');

    if (search) {
      queryBuilder.andWhere('category.name LIKE :search', {
        search: `%${search}%`,
      });
    }

    const [data, total] = await queryBuilder
      .orderBy('category.name', 'ASC')
      .getManyAndCount();

    // Cache the result for 60 seconds
    await this.cacheManager.set(cacheKey, data, 60);
    return data;
  }

  async findOne(id: number): Promise<Category> {
    const category = await this.categoryRepository.findOne({
      where: { id },
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
        },
      });

      if (existingCategory) {
        throw new ConflictException('A category with this name already exists');
      }
    }

    Object.assign(category, updateCategoryDto);
    const saved = await this.categoryRepository.save(category);
    await this.resetCache();
    return saved;
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
    await this.resetCache();
  }

  async findBooksByCategory(
    id: number,
    { page = 1, limit = 10 }: PaginationOptions,
  ): Promise<PaginatedResponseDto<any>> {
    const skip = (page - 1) * limit;

    const category = await this.categoryRepository.findOne({
      where: { id },
      relations: ['books'],
    });

    if (!category) {
      throw new NotFoundException(`Category with ID ${id} not found`);
    }

    const [data, total] = await this.categoryRepository
      .createQueryBuilder('category')
      .leftJoinAndSelect('category.books', 'book')
      .where('category.id = :id', { id })
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
