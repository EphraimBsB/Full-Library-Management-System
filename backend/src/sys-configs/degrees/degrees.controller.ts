import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  ParseUUIDPipe,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { DegreesService } from './degrees.service';
import { CreateDegreeDto } from './dto/create-degree.dto';
import { UpdateDegreeDto } from './dto/update-degree.dto';
import { Degree } from './entities/degree.entity';
import { Public } from 'src/auth/decorators/public.decorator';

@ApiTags('degrees')
@Controller('degrees')
export class DegreesController {
  constructor(private readonly degreesService: DegreesService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new degree program' })
  @ApiResponse({ status: 201, description: 'Degree program created successfully', type: Degree })
  create(@Body() createDegreeDto: CreateDegreeDto) {
    return this.degreesService.create(createDegreeDto);
  }

  @Get()
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get all degree programs' })
  @ApiResponse({ status: 200, description: 'Return all degree programs', type: [Degree] })
  findAll() {
    return this.degreesService.findAll();
  }

  @Get(':id')
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get a degree program by ID' })
  @ApiResponse({ status: 200, description: 'Return the degree program', type: Degree })
  @ApiResponse({ status: 404, description: 'Degree program not found' })
  findOne(@Param('id', ParseUUIDPipe) id: number) {
    return this.degreesService.findOne(id);
  }

  @Get('name/:name')
  @ApiOperation({ summary: 'Get a degree program by name' })
  @ApiResponse({ status: 200, description: 'Return the degree program by name', type: Degree })
  findByName(@Param('name') name: string) {
    return this.degreesService.findByName(name);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a degree program' })
  @ApiResponse({ status: 200, description: 'Degree program updated successfully', type: Degree })
  @ApiResponse({ status: 404, description: 'Degree program not found' })
  update(
    @Param('id', ParseUUIDPipe) id: number,
    @Body() updateDegreeDto: UpdateDegreeDto,
  ) {
    return this.degreesService.update(id, updateDegreeDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a degree program' })
  @ApiResponse({ status: 200, description: 'Degree program deleted successfully' })
  @ApiResponse({ status: 404, description: 'Degree program not found' })
  remove(@Param('id', ParseUUIDPipe) id: number) {
    return this.degreesService.remove(id);
  }
}
