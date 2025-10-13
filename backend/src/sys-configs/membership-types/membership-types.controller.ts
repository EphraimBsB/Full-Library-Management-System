import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  ParseUUIDPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { MembershipTypesService } from './membership-types.service';
import { CreateMembershipTypeDto } from './dto/create-membership-type.dto';
import { UpdateMembershipTypeDto } from './dto/update-membership-type.dto';
import { MembershipType } from './entities/membership-type.entity';

@ApiTags('membership-types')
@Controller('membership-types')
export class MembershipTypesController {
  constructor(private readonly membershipTypesService: MembershipTypesService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new membership type' })
  @ApiResponse({ status: 201, description: 'Membership type created successfully', type: MembershipType })
  create(@Body() createMembershipTypeDto: CreateMembershipTypeDto) {
    return this.membershipTypesService.create(createMembershipTypeDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all membership types' })
  @ApiResponse({ status: 200, description: 'Return all membership types', type: [MembershipType] })
  findAll() {
    return this.membershipTypesService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a membership type by ID' })
  @ApiResponse({ status: 200, description: 'Return the membership type', type: MembershipType })
  @ApiResponse({ status: 404, description: 'Membership type not found' })
  findOne(@Param('id', ParseUUIDPipe) id: number) {
    return this.membershipTypesService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a membership type' })
  @ApiResponse({ status: 200, description: 'Membership type updated successfully', type: MembershipType })
  @ApiResponse({ status: 404, description: 'Membership type not found' })
  update(
    @Param('id', ParseUUIDPipe) id: number,
    @Body() updateMembershipTypeDto: UpdateMembershipTypeDto,
  ) {
    return this.membershipTypesService.update(id, updateMembershipTypeDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a membership type' })
  @ApiResponse({ status: 200, description: 'Membership type deleted successfully' })
  @ApiResponse({ status: 404, description: 'Membership type not found' })
  remove(@Param('id', ParseUUIDPipe) id: number) {
    return this.membershipTypesService.remove(id);
  }
}
