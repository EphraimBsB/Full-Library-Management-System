import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { UserRole } from 'src/common/enums/user-role.enum';
import { CreateShelfDto } from './dto/create-shelf.dto';
import { UpdateShelfDto } from './dto/update-shelf.dto';
import { Shelf } from './entities/shelf.entity';
import { ShelvesService } from './shelves.service';

@ApiTags('Shelves')
@ApiBearerAuth()
@Controller('shelves')
export class ShelvesController {
  constructor(private readonly shelvesService: ShelvesService) {}

  @Post()
  @Roles(UserRole.ADMIN, UserRole.LIBRARIAN)
  @ApiOperation({ summary: 'Create a new shelf' })
  @ApiResponse({
    status: 201,
    description: 'Shelf successfully created',
    type: Shelf,
  })
  create(@Body() createShelfDto: CreateShelfDto) {
    return this.shelvesService.create(createShelfDto);
  }

  @Get()
  @Roles(UserRole.ADMIN, UserRole.LIBRARIAN, UserRole.STUDENT)
  @ApiOperation({ summary: 'Get all shelves' })
  @ApiResponse({
    status: 200,
    description: 'Return all shelves',
    type: [Shelf],
  })
  findAll() {
    return this.shelvesService.findAll();
  }

  @Get(':id')
  @Roles(UserRole.ADMIN, UserRole.LIBRARIAN, UserRole.STUDENT)
  @ApiOperation({ summary: 'Get a shelf by ID' })
  @ApiResponse({ status: 200, description: 'Return the shelf', type: Shelf })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.shelvesService.findOne(id);
  }

  @Patch(':id/status')
  @Roles(UserRole.ADMIN, UserRole.LIBRARIAN)
  @ApiOperation({ summary: 'Toggle shelf status' })
  @ApiResponse({
    status: 200,
    description: 'Shelf status toggled successfully',
    type: Shelf,
  })
  toggleStatus(@Param('id', ParseIntPipe) id: number) {
    return this.shelvesService.toggleStatus(id);
  }

  @Patch(':id')
  @Roles(UserRole.ADMIN, UserRole.LIBRARIAN)
  @ApiOperation({ summary: 'Update a shelf' })
  @ApiResponse({
    status: 200,
    description: 'Shelf successfully updated',
    type: Shelf,
  })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateShelfDto: UpdateShelfDto,
  ) {
    return this.shelvesService.update(id, updateShelfDto);
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN, UserRole.LIBRARIAN)
  @ApiOperation({ summary: 'Delete a shelf' })
  @ApiResponse({ status: 200, description: 'Shelf successfully deleted' })
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.shelvesService.remove(id);
  }
}
