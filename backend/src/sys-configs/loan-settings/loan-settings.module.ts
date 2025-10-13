import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LoanSettings } from './loan-settings.entity';
import { LoanSettingsService } from './loan-settings.service';
import { LoanSettingsController } from './loan-settings.controller';
@Module({
  imports: [TypeOrmModule.forFeature([LoanSettings])],
  providers: [LoanSettingsService],
  controllers: [LoanSettingsController],
  exports: [LoanSettingsService],
})
export class LoanSettingsModule {}
