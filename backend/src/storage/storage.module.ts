import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { StorageService } from './storage.service';
import { StorageController } from './storage.controller';
import { FileRecord } from './entities/file-record.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([FileRecord]),
    ConfigModule,
  ],
  providers: [StorageService],
  controllers: [StorageController],
  exports: [StorageService],
})
export class StorageModule {}
