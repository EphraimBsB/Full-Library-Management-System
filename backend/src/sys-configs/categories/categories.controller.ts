import { Controller, Get, Post, Body, Patch, Param, Delete, HttpCode, ParseIntPipe, Put, Query, UsePipes, ValidationPipe } from '@nestjs/common';
import { CategoriesService } from './categories.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { ApiOperation, ApiParam, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Public } from 'src/auth/decorators/public.decorator';
import { PaginatedResponseDto } from 'src/common';
import { Category } from './entities/category.entity';

@ApiTags('categories')
@Controller('categories')
export class CategoriesController {
  constructor(private readonly categoriesService: CategoriesService) {}

   @Post()
    @ApiOperation({ summary: 'Create a new category' })
    @ApiResponse({ status: 201, description: 'Category successfully created', type: Category })
    @ApiResponse({ status: 400, description: 'Bad request' })
    @UsePipes(new ValidationPipe({ transform: true }))
    async create(@Body() createCategoryDto: CreateCategoryDto): Promise<Category> {
      return this.categoriesService.create(createCategoryDto);
    }
  
    @Get()
    @ApiOperation({ summary: 'Get all categories with pagination' })
    @Public()
    @ApiQuery({ name: 'page', required: false, type: Number, example: 1 })
    @ApiQuery({ name: 'limit', required: false, type: Number, example: 10 })
    @ApiQuery({ name: 'search', required: false, type: String })
    @ApiResponse({ status: 200, description: 'Categories retrieved successfully', type: PaginatedResponseDto })
    async findAll(
      @Query('page') page = 1,
      @Query('limit') limit = 10,
      @Query('search') search?: string,
    ): Promise<Category[]> {
      return this.categoriesService.findAll({ page, limit, search });
    }
  
    @Get(':id')
    @ApiOperation({ summary: 'Get a category by ID' })
    @Public()
    @ApiParam({ name: 'id', description: 'Category ID' })
    @ApiResponse({ status: 200, description: 'Category found', type: Category })
    @ApiResponse({ status: 404, description: 'Category not found' })
    async findOne(@Param('id', ParseIntPipe) id: number): Promise<Category> {
      return this.categoriesService.findOne(id);
    }
  
    @Put(':id')
    @ApiOperation({ summary: 'Update a category' })
    @ApiParam({ name: 'id', description: 'Category ID' })
    @ApiResponse({ status: 200, description: 'Category updated', type: Category })
    @ApiResponse({ status: 404, description: 'Category not found' })
    @ApiResponse({ status: 400, description: 'Bad request' })
    @UsePipes(new ValidationPipe({ transform: true }))
    async update(
      @Param('id', ParseIntPipe) id: number,
      @Body() updateCategoryDto: UpdateCategoryDto,
    ): Promise<Category> {
      return this.categoriesService.update(id, updateCategoryDto);
    }
  
    @Delete(':id')
    @HttpCode(204)
    @ApiOperation({ summary: 'Delete a category' })
    @ApiParam({ name: 'id', description: 'Category ID' })
    @ApiResponse({ status: 204, description: 'Category deleted' })
    @ApiResponse({ status: 404, description: 'Category not found' })
    async remove(@Param('id', ParseIntPipe) id: number): Promise<void> {
      return this.categoriesService.remove(id);
    }
  
    @Get(':id/books')
    @ApiOperation({ summary: 'Get all books in a category' })
    @ApiParam({ name: 'id', description: 'Category ID' })
    @ApiQuery({ name: 'page', required: false, type: Number, example: 1 })
    @ApiQuery({ name: 'limit', required: false, type: Number, example: 10 })
    @ApiResponse({ status: 200, description: 'Books retrieved successfully', type: PaginatedResponseDto })
    async findBooksByCategory(
      @Param('id', ParseIntPipe) id: number,
      @Query('page') page = 1,
      @Query('limit') limit = 10,
    ): Promise<PaginatedResponseDto<any>> {
      return this.categoriesService.findBooksByCategory(id, { page, limit });
    }
}
