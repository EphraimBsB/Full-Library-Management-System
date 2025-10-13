import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Degree } from './entities/degree.entity';
import { DegreesService } from './degrees.service';
import { DegreesController } from './degrees.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Degree])],
  controllers: [DegreesController],
  providers: [DegreesService],
  exports: [DegreesService],
})
export class DegreesModule {}
