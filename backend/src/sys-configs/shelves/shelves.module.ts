import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Location } from '../locations/entities/location.entity';
import { Shelf } from './entities/shelf.entity';
import { ShelvesController } from './shelves.controller';
import { ShelvesService } from './shelves.service';

@Module({
  imports: [TypeOrmModule.forFeature([Shelf, Location])],
  controllers: [ShelvesController],
  providers: [ShelvesService],
  exports: [ShelvesService],
})
export class ShelvesModule {}
