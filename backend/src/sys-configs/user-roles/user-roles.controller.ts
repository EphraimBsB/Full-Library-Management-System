import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  ParseIntPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { UserRolesService } from './user-roles.service';
import { CreateUserRoleDto } from './dto/create-user-role.dto';
import { UpdateUserRoleDto } from './dto/update-user-role.dto';
import { UserRole } from './entities/user-role.entity';

@ApiTags('user-roles')
@Controller('user-roles')
export class UserRolesController {
  constructor(private readonly userRolesService: UserRolesService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new user role' })
  @ApiResponse({ status: 201, description: 'User role created successfully', type: UserRole })
  create(@Body() createUserRoleDto: CreateUserRoleDto) {
    return this.userRolesService.create(createUserRoleDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all user roles' })
  @ApiResponse({ status: 200, description: 'Return all user roles', type: [UserRole] })
  findAll() {
    return this.userRolesService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a user role by ID' })
  @ApiResponse({ status: 200, description: 'Return the user role', type: UserRole })
  @ApiResponse({ status: 404, description: 'User role not found' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.userRolesService.findOne(id);
  }

  @Patch(':id/status')
  @ApiOperation({ summary: 'Toggle user role status' })
  @ApiResponse({ status: 200, description: 'User role status toggled successfully', type: UserRole })
  toggleStatus(@Param('id', ParseIntPipe) id: number) {
    return this.userRolesService.toggleStatus(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a user role' })
  @ApiResponse({ status: 200, description: 'User role updated successfully', type: UserRole })
  @ApiResponse({ status: 404, description: 'User role not found' })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateUserRoleDto: UpdateUserRoleDto,
  ) {
    return this.userRolesService.update(id, updateUserRoleDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a user role' })
  @ApiResponse({ status: 200, description: 'User role deleted successfully' })
  @ApiResponse({ status: 404, description: 'User role not found' })
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.userRolesService.remove(id);
  }
}
