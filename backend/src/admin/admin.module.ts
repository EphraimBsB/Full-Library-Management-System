import { Module } from '@nestjs/common';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';
import { BullModule } from '@nestjs/bull';
import { CacheModule } from '@nestjs/cache-manager';

@Module({
  imports: [
    CacheModule.register(),
    BullModule.registerQueue({ name: 'book-loan' }),
  ],
  controllers: [AdminController],
  providers: [AdminService],
})
export class AdminModule {}
