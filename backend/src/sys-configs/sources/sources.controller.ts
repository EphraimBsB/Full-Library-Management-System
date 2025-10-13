import { Controller, Get, Post, Body, Patch, Param, Delete, Query } from '@nestjs/common';
import { SourcesService } from './sources.service';
import { CreateSourceDto } from './dto/create-source.dto';
import { UpdateSourceDto } from './dto/update-source.dto';
import { ApiOperation, ApiResponse } from '@nestjs/swagger';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { UserRole } from 'src/common/enums/user-role.enum';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('Sources')
@ApiBearerAuth()
@Controller('sources')
export class SourcesController {
  constructor(private readonly sourcesService: SourcesService) {}

   @Post()
    @Roles(UserRole.ADMIN, UserRole.LIBRARIAN)
    @ApiOperation({ summary: 'Create a new book source' })
    @ApiResponse({ status: 201, description: 'Book source successfully created' })
    @ApiResponse({ status: 400, description: 'Invalid input' })
    @ApiResponse({ status: 401, description: 'Unauthorized' })
    @ApiResponse({ status: 403, description: 'Forbidden - Insufficient permissions' })
    create(@Body() createSourceDto: CreateSourceDto) {
      return this.sourcesService.create(createSourceDto);
    }
  
    @Get()
    @Roles(UserRole.ADMIN, UserRole.LIBRARIAN, UserRole.STUDENT)
    @ApiOperation({ summary: 'Get all book sources' })
    @ApiResponse({ status: 200, description: 'Return all book sources' })
    @ApiResponse({ status: 401, description: 'Unauthorized' })
    @ApiResponse({ status: 403, description: 'Forbidden - Insufficient permissions' })
    findAll() {
      return this.sourcesService.findAll();
    }
  
    @Get('search')
    @Roles(UserRole.ADMIN, UserRole.LIBRARIAN, UserRole.STUDENT)
    @ApiOperation({ summary: 'Search book sources by name' })
    @ApiResponse({ status: 200, description: 'Return matching book sources' })
    @ApiResponse({ status: 401, description: 'Unauthorized' })
    @ApiResponse({ status: 403, description: 'Forbidden - Insufficient permissions' })
    findByName(@Query('name') name: string) {
      return this.sourcesService.findByName(name);
    }
  
    @Get(':id')
    @Roles(UserRole.ADMIN, UserRole.LIBRARIAN, UserRole.STUDENT)
    @ApiOperation({ summary: 'Get a book source by ID' })
    @ApiResponse({ status: 200, description: 'Return the book source' })
    @ApiResponse({ status: 404, description: 'Book source not found' })
    @ApiResponse({ status: 401, description: 'Unauthorized' })
    @ApiResponse({ status: 403, description: 'Forbidden - Insufficient permissions' })
    findOne(@Param('id') id: number) {
      return this.sourcesService.findOne(id);
    }
  
    @Patch(':id')
    @Roles(UserRole.ADMIN, UserRole.LIBRARIAN)
    @ApiOperation({ summary: 'Update a book source' })
    @ApiResponse({ status: 200, description: 'Book source successfully updated' })
    @ApiResponse({ status: 400, description: 'Invalid input' })
    @ApiResponse({ status: 404, description: 'Book source not found' })
    @ApiResponse({ status: 401, description: 'Unauthorized' })
    @ApiResponse({ status: 403, description: 'Forbidden - Insufficient permissions' })
    update(@Param('id') id: number, @Body() updateSourceDto: UpdateSourceDto) {
      return this.sourcesService.update(id, updateSourceDto);
    }
  
    @Delete(':id')
    @Roles(UserRole.ADMIN, UserRole.LIBRARIAN)
    @ApiOperation({ summary: 'Delete a book source' })
    @ApiResponse({ status: 200, description: 'Book source successfully deleted' })
    @ApiResponse({ status: 404, description: 'Book source not found' })
    @ApiResponse({ status: 400, description: 'Cannot delete - books are associated with this source' })
    @ApiResponse({ status: 401, description: 'Unauthorized' })
    @ApiResponse({ status: 403, description: 'Forbidden - Insufficient permissions' })
    remove(@Param('id') id: number) {
      return this.sourcesService.remove(id);
    }
}
