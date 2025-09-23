import { 
  Controller, 
  Get, 
  Post, 
  Body, 
  Param, 
  Put, 
  Delete, 
  Query, 
  UsePipes, 
  ValidationPipe, 
  ParseIntPipe
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiQuery } from '@nestjs/swagger';
import { Subject } from '../entities/subject.entity';
import { SubjectService } from '../../books/services/subject.service';
import { CreateSubjectDto, UpdateSubjectDto } from '../dto/subject.dto';
import { PaginatedResponseDto } from '../../common/dto/paginated-response.dto';
import { Public } from 'src/auth/decorators/public.decorator';

@ApiTags('subjects')
@Controller('subjects')
export class SubjectController {
  constructor(private readonly subjectService: SubjectService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new subject' })
  @ApiResponse({ status: 201, description: 'Subject successfully created', type: Subject })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @UsePipes(new ValidationPipe({ transform: true }))
  async create(@Body() createSubjectDto: CreateSubjectDto): Promise<Subject> {
    return this.subjectService.create(createSubjectDto);
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
  ): Promise<PaginatedResponseDto<Subject>> {
    return this.subjectService.findAll({ page, limit, search });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a subject by ID' })
  @Public()
  @ApiParam({ name: 'id', description: 'Subject ID' })
  @ApiResponse({ status: 200, description: 'Subject found', type: Subject })
  @ApiResponse({ status: 404, description: 'Subject not found' })
  async findOne(@Param('id', ParseIntPipe) id: number): Promise<Subject> {
    return this.subjectService.findOne(id);
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
    return this.subjectService.update(id, updateSubjectDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a subject' })
  @ApiParam({ name: 'id', description: 'Subject ID' })
  @ApiResponse({ status: 200, description: 'Subject deleted successfully' })
  @ApiResponse({ status: 404, description: 'Subject not found' })
  async remove(@Param('id', ParseIntPipe) id: number): Promise<void> {
    return this.subjectService.remove(id);
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
    return this.subjectService.findBooksBySubject(id, { page, limit });
  }
}
