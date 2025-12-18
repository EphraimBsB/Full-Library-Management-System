import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { StudentsController } from './students.controller';
import { StudentsService } from './students.service';

@Module({
  imports: [HttpModule],
  controllers: [StudentsController],
  providers: [StudentsService],
  exports: [StudentsService],
})
export class StudentsModule {}
