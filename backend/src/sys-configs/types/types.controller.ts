import { Controller, Get, Post, Body, Patch, Param, Delete, Query } from '@nestjs/common';
import { TypesService } from './types.service';
import { CreateTypeDto } from './dto/create-type.dto';
import { UpdateTypeDto } from './dto/update-type.dto';
import { ApiOperation, ApiResponse } from '@nestjs/swagger';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { UserRole } from 'src/common/enums/user-role.enum';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('Types')
@ApiBearerAuth()
@Controller('types')
export class TypesController {
  constructor(private readonly typesService: TypesService) { }

  @Post()
  @Roles(UserRole.ADMIN, UserRole.LIBRARIAN)
  @ApiOperation({ summary: 'Create a new book type' })
  @ApiResponse({ status: 201, description: 'Book type successfully created' })
  @ApiResponse({ status: 400, description: 'Invalid input' })
  @ApiResponse({ status: 409, description: 'Book type with this name already exists' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Insufficient permissions' })
  create(@Body() createTypeDto: CreateTypeDto) {
    return this.typesService.create(createTypeDto);
  }

  @Get()
  @Roles(UserRole.ADMIN, UserRole.LIBRARIAN, UserRole.STUDENT)
  @ApiOperation({ summary: 'Get all book types' })
  @ApiResponse({ status: 200, description: 'Return all book types' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Insufficient permissions' })
  findAll() {
    return this.typesService.findAll();
  }

  @Get('search')
  @Roles(UserRole.ADMIN, UserRole.LIBRARIAN, UserRole.STUDENT)
  @ApiOperation({ summary: 'Search book types by name' })
  @ApiResponse({ status: 200, description: 'Return matching book types' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Insufficient permissions' })
  findByName(@Query('name') name: string) {
    return this.typesService.findByName(name);
  }

  @Get(':id')
  @Roles(UserRole.ADMIN, UserRole.LIBRARIAN, UserRole.STUDENT)
  @ApiOperation({ summary: 'Get a book type by ID' })
  @ApiResponse({ status: 200, description: 'Return the book type' })
  @ApiResponse({ status: 404, description: 'Book type not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Insufficient permissions' })
  findOne(@Param('id') id: number) {
    return this.typesService.findOne(id);
  }

  @Patch(':id')
  @Roles(UserRole.ADMIN, UserRole.LIBRARIAN)
  @ApiOperation({ summary: 'Update a book type' })
  @ApiResponse({ status: 200, description: 'Book type successfully updated' })
  @ApiResponse({ status: 400, description: 'Invalid input' })
  @ApiResponse({ status: 404, description: 'Book type not found' })
  @ApiResponse({ status: 409, description: 'Book type with this name already exists' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Insufficient permissions' })
  update(@Param('id') id: number, @Body() updateTypeDto: UpdateTypeDto) {
    return this.typesService.update(id, updateTypeDto);
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN, UserRole.LIBRARIAN)
  @ApiOperation({ summary: 'Delete a book type' })
  @ApiResponse({ status: 200, description: 'Book type successfully deleted' })
  @ApiResponse({ status: 404, description: 'Book type not found' })
  @ApiResponse({ status: 400, description: 'Cannot delete - books are associated with this type' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Insufficient permissions' })
  remove(@Param('id') id: number) {
    return this.typesService.remove(id);
  }
}
