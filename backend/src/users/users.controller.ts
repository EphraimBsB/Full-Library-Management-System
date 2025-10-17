import { Controller, Get, Post, Body, Patch, Param, Delete, Query, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../common/enums/user-role.enum';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { PaginationOptions } from 'src/common/interfaces/pagination-options.interface';
import { UserProfileSummaryDto } from './dto/user-profile.dto';
import { BookLoan } from '../books/entities/book-loan.entity';
import { BookFavorite } from '../books/entities/book-favorite.entity';
import { BookNote } from '../books/entities/book-note.entity';

@ApiTags('users')
@Controller('users')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  @Roles(UserRole.ADMIN, UserRole.LIBRARIAN)
  @ApiOperation({ summary: 'Create a new user' })
  @ApiResponse({ status: 201, description: 'User successfully created' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 409, description: 'User with email/roll number already exists' })
  create(@Body() createUserDto: CreateUserDto) {
    return this.usersService.create(createUserDto);
  }

  @Get()
  @Roles(UserRole.ADMIN, UserRole.LIBRARIAN)
  @ApiOperation({ summary: 'Get all users with pagination' })
  @ApiResponse({ status: 200, description: 'Users retrieved successfully' })
  findAll(
    @Query('page') page = 1,
    @Query('limit') limit = 10,
    @Query('search') search?: string,
  ) {
    return this.usersService.findAll({ page, limit, search });
  }

  @Get(':id')
  @Roles(UserRole.ADMIN, UserRole.LIBRARIAN)
  @ApiOperation({ summary: 'Get a user by ID' })
  @ApiResponse({ status: 200, description: 'User retrieved successfully' })
  @ApiResponse({ status: 404, description: 'User not found' })
  findOne(@Param('id') id: string) {
    return this.usersService.findOne(id);
  }

  @Get(':id/profile-summary')
  @ApiOperation({ summary: 'Get user profile summary' })
  @ApiResponse({ status: 200, description: 'Profile summary retrieved successfully', type: UserProfileSummaryDto })
  @ApiResponse({ status: 404, description: 'User not found' })
  async getProfileSummary(@Param('id') userId: string) {
    return this.usersService.getUserProfileSummary(userId);
  }

  @Get(':id/borrow-history')
  @ApiOperation({ summary: 'Get user borrow history' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  async getBorrowHistory(
    @Param('id') userId: string,
    @Query('page') page = 1,
    @Query('limit') limit = 10,
  ) {
    return this.usersService.getUserBorrowHistory(userId, { page, limit });
  }

  @Get(':id/favorites')
  @ApiOperation({ summary: 'Get user favorite books' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  async getFavorites(
    @Param('id') userId: string,
    @Query('page') page = 1,
    @Query('limit') limit = 10,
  ) {
    return this.usersService.getUserFavorites(userId, { page, limit });
  }

  @Get(':id/notes')
  @ApiOperation({ summary: 'Get user notes' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  async getNotes(
    @Param('id') userId: string,
    @Query('page') page = 1,
    @Query('limit') limit = 10,
  ) {
    return this.usersService.getUserNotes(userId, { page, limit });
  }

  @Patch(':id')
  @Roles(UserRole.ADMIN, UserRole.LIBRARIAN)
  @ApiOperation({ summary: 'Update a user' })
  @ApiResponse({ status: 200, description: 'User updated successfully' })
  @ApiResponse({ status: 404, description: 'User not found' })
  @ApiResponse({ status: 409, description: 'Email/roll number already in use' })
  update(@Param('id') id: string, @Body() updateUserDto: UpdateUserDto) {
    return this.usersService.update(id, updateUserDto);
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN, UserRole.LIBRARIAN)
  @ApiOperation({ summary: 'Delete a user (soft delete)' })
  @ApiResponse({ status: 200, description: 'User deleted successfully' })
  @ApiResponse({ status: 400, description: 'Cannot delete user with active loans' })
  @ApiResponse({ status: 404, description: 'User not found' })
  remove(@Param('id') id: string) {
    return this.usersService.remove(id);
  }

  @Post(':id/deactivate')
  @Roles(UserRole.ADMIN, UserRole.LIBRARIAN)
  @ApiOperation({ summary: 'Deactivate a user account' })
  @ApiResponse({ status: 200, description: 'User deactivated successfully' })
  @ApiResponse({ status: 404, description: 'User not found' })
  deactivate(@Param('id') id: string) {
    return this.usersService.deactivateUser(id);
  }

  @Post(':id/activate')
  @Roles(UserRole.ADMIN, UserRole.LIBRARIAN)
  @ApiOperation({ summary: 'Activate a user account' })
  @ApiResponse({ status: 200, description: 'User activated successfully' })
  @ApiResponse({ status: 404, description: 'User not found' })
  activate(@Param('id') id: string) {
    return this.usersService.activateUser(id);
  }
}
