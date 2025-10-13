import { Controller, Get, Post, Body, Patch, Param, Delete, ParseIntPipe, Put, Query, UsePipes, ValidationPipe } from '@nestjs/common';
import { SubjectsService } from './subjects.service';
import { CreateSubjectDto } from './dto/create-subject.dto';
import { UpdateSubjectDto } from './dto/update-subject.dto';
import { ApiOperation, ApiResponse, ApiQuery, ApiParam } from '@nestjs/swagger';
import { Subject } from './entities/subject.entity';
import { Public } from 'src/auth/decorators/public.decorator';
import { PaginatedResponseDto } from 'src/common';
import { ApiTags } from '@nestjs/swagger';

@ApiTags('Subjects')
@Controller('subjects')
export class SubjectsController {
  constructor(private readonly subjectsService: SubjectsService) {}

  @Post()
    @ApiOperation({ summary: 'Create a new subject' })
    @ApiResponse({ status: 201, description: 'Subject successfully created', type: Subject })
    @ApiResponse({ status: 400, description: 'Bad request' })
    @UsePipes(new ValidationPipe({ transform: true }))
    async create(@Body() createSubjectDto: CreateSubjectDto): Promise<Subject> {
      return this.subjectsService.create(createSubjectDto);
    }
  
    @Get()
    @ApiOperation({ summary: 'Get all subjects with pagination' })
    @Public()
    @ApiQuery({ name: 'page', required: false, type: Number, example: 1 })
    @ApiQuery({ name: 'limit', required: false, type: Number, example: 10 })
    @ApiQuery({ name: 'search', required: false, type: String })
    @ApiResponse({ status: 200, description: 'Subjects retrieved successfully', type: PaginatedResponseDto })
    async findAll(
      @Query('page') page = 1,
      @Query('limit') limit = 10,
      @Query('search') search?: string,
    ): Promise<Subject[]> {
      return this.subjectsService.findAll({ page, limit, search });
    }
  
    @Get(':id')
    @ApiOperation({ summary: 'Get a subject by ID' })
    @Public()
    @ApiParam({ name: 'id', description: 'Subject ID' })
    @ApiResponse({ status: 200, description: 'Subject found', type: Subject })
    @ApiResponse({ status: 404, description: 'Subject not found' })
    async findOne(@Param('id', ParseIntPipe) id: number): Promise<Subject> {
      return this.subjectsService.findOne(id);
    }
  
    @Put(':id')
    @ApiOperation({ summary: 'Update a subject' })
    @ApiParam({ name: 'id', description: 'Subject ID' })
    @ApiResponse({ status: 200, description: 'Subject updated successfully', type: Subject })
    @ApiResponse({ status: 404, description: 'Subject not found' })
    @UsePipes(new ValidationPipe({ transform: true }))
    async update(
      @Param('id', ParseIntPipe) id: number,
      @Body() updateSubjectDto: UpdateSubjectDto,
    ): Promise<Subject> {
      return this.subjectsService.update(id, updateSubjectDto);
    }
  
    @Delete(':id')
    @ApiOperation({ summary: 'Delete a subject' })
    @ApiParam({ name: 'id', description: 'Subject ID' })
    @ApiResponse({ status: 200, description: 'Subject deleted successfully' })
    @ApiResponse({ status: 404, description: 'Subject not found' })
    async remove(@Param('id', ParseIntPipe) id: number): Promise<void> {
      return this.subjectsService.remove(id);
    }
  
    @Get(':id/books')
    @ApiOperation({ summary: 'Get all books for a subject' })
    @ApiParam({ name: 'id', description: 'Subject ID' })
    @ApiQuery({ name: 'page', required: false, type: Number, example: 1 })
    @ApiQuery({ name: 'limit', required: false, type: Number, example: 10 })
    @ApiResponse({ status: 200, description: 'Books retrieved successfully', type: PaginatedResponseDto })
    async findBooksBySubject(
      @Param('id', ParseIntPipe) id: number,
      @Query('page') page = 1,
      @Query('limit') limit = 10,
    ): Promise<PaginatedResponseDto<any>> {
      return this.subjectsService.findBooksBySubject(id, { page, limit });
    }
}
