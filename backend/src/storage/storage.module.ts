import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { StorageService } from './storage.service';
import { StorageController } from './storage.controller';
import { FileManagementController } from './file-management.controller';
import { StorageSyncService } from './storage-sync.service';
import { FileRecord } from './entities/file-record.entity';

@Module({
  imports: [TypeOrmModule.forFeature([FileRecord]), ConfigModule],
  providers: [StorageService, StorageSyncService],
  controllers: [StorageController, FileManagementController],
  exports: [StorageService, StorageSyncService],
})
export class StorageModule {}
