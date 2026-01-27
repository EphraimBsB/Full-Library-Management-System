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
import { CreatePublisherDto } from './dto/create-publisher.dto';
import { UpdatePublisherDto } from './dto/update-publisher.dto';
import { Publisher } from './entities/publisher.entity';
import { PublishersService } from './publishers.service';

@ApiTags('Publishers')
@ApiBearerAuth()
@Controller('publishers')
export class PublishersController {
  constructor(private readonly publishersService: PublishersService) {}

  @Post()
  @Roles(UserRole.ADMIN, UserRole.LIBRARIAN)
  @ApiOperation({ summary: 'Create a new publisher' })
  @ApiResponse({
    status: 201,
    description: 'Publisher successfully created',
    type: Publisher,
  })
  create(@Body() createPublisherDto: CreatePublisherDto) {
    return this.publishersService.create(createPublisherDto);
  }

  @Get()
  @Roles(UserRole.ADMIN, UserRole.LIBRARIAN, UserRole.STUDENT)
  @ApiOperation({ summary: 'Get all publishers' })
  @ApiResponse({
    status: 200,
    description: 'Return all publishers',
    type: [Publisher],
  })
  findAll() {
    return this.publishersService.findAll();
  }

  @Get(':id')
  @Roles(UserRole.ADMIN, UserRole.LIBRARIAN, UserRole.STUDENT)
  @ApiOperation({ summary: 'Get a publisher by ID' })
  @ApiResponse({
    status: 200,
    description: 'Return the publisher',
    type: Publisher,
  })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.publishersService.findOne(id);
  }

  @Patch(':id/status')
  @Roles(UserRole.ADMIN, UserRole.LIBRARIAN)
  @ApiOperation({ summary: 'Toggle publisher status' })
  @ApiResponse({
    status: 200,
    description: 'Publisher status toggled successfully',
    type: Publisher,
  })
  toggleStatus(@Param('id', ParseIntPipe) id: number) {
    return this.publishersService.toggleStatus(id);
  }

  @Patch(':id')
  @Roles(UserRole.ADMIN, UserRole.LIBRARIAN)
  @ApiOperation({ summary: 'Update a publisher' })
  @ApiResponse({
    status: 200,
    description: 'Publisher successfully updated',
    type: Publisher,
  })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updatePublisherDto: UpdatePublisherDto,
  ) {
    return this.publishersService.update(id, updatePublisherDto);
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN, UserRole.LIBRARIAN)
  @ApiOperation({ summary: 'Delete a publisher' })
  @ApiResponse({ status: 200, description: 'Publisher successfully deleted' })
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.publishersService.remove(id);
  }
}
