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
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { UserRole } from 'src/common/enums/user-role.enum';
import { CreateLocationDto } from './dto/create-location.dto';
import { UpdateLocationDto } from './dto/update-location.dto';
import { Location } from './entities/location.entity';
import { LocationsService } from './locations.service';

@ApiTags('Locations')
@ApiBearerAuth()
@Controller('locations')
export class LocationsController {
  constructor(private readonly locationsService: LocationsService) {}

  @Post()
  @Roles(UserRole.ADMIN, UserRole.LIBRARIAN)
  @ApiOperation({ summary: 'Create a new location' })
  @ApiResponse({ status: 201, description: 'Location successfully created', type: Location })
  create(@Body() createLocationDto: CreateLocationDto) {
    return this.locationsService.create(createLocationDto);
  }

  @Get()
  @Roles(UserRole.ADMIN, UserRole.LIBRARIAN, UserRole.STUDENT)
  @ApiOperation({ summary: 'Get all locations' })
  @ApiResponse({ status: 200, description: 'Return all locations', type: [Location] })
  findAll() {
    return this.locationsService.findAll();
  }

  @Get(':id')
  @Roles(UserRole.ADMIN, UserRole.LIBRARIAN, UserRole.STUDENT)
  @ApiOperation({ summary: 'Get a location by ID' })
  @ApiResponse({ status: 200, description: 'Return the location', type: Location })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.locationsService.findOne(id);
  }

  @Patch(':id/status')
  @Roles(UserRole.ADMIN, UserRole.LIBRARIAN)
  @ApiOperation({ summary: 'Toggle location status' })
  @ApiResponse({ status: 200, description: 'Location status toggled successfully', type: Location })
  toggleStatus(@Param('id', ParseIntPipe) id: number) {
    return this.locationsService.toggleStatus(id);
  }

  @Patch(':id')
  @Roles(UserRole.ADMIN, UserRole.LIBRARIAN)
  @ApiOperation({ summary: 'Update a location' })
  @ApiResponse({ status: 200, description: 'Location successfully updated', type: Location })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateLocationDto: UpdateLocationDto,
  ) {
    return this.locationsService.update(id, updateLocationDto);
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN, UserRole.LIBRARIAN)
  @ApiOperation({ summary: 'Delete a location' })
  @ApiResponse({ status: 200, description: 'Location successfully deleted' })
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.locationsService.remove(id);
  }
}
