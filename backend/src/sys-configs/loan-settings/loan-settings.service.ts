import { Injectable, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { LoanSettings } from './loan-settings.entity';

@Injectable()
export class LoanSettingsService implements OnModuleInit {
  private defaultSettings: Partial<LoanSettings> = {
    autoApproveQueueLoans: false,
    queueHoldDurationHours: 24,
  };

  constructor(
    @InjectRepository(LoanSettings)
    private readonly loanSettingsRepository: Repository<LoanSettings>,
  ) {}

  async onModuleInit() {
    // Ensure default settings exist when the module initializes
    await this.ensureDefaultSettings();
  }

  private async ensureDefaultSettings() {
    const count = await this.loanSettingsRepository.count();
    if (count === 0) {
      await this.loanSettingsRepository.save(
        this.loanSettingsRepository.create(this.defaultSettings)
      );
    }
  }

  async getSettings(): Promise<LoanSettings> {
    const settings = await this.loanSettingsRepository.findOne({
      order: { id: 'ASC' },
    });
    
    if (!settings) {
      return this.loanSettingsRepository.save(
        this.loanSettingsRepository.create(this.defaultSettings)
      );
    }
    
    return settings;
  }

  async updateSettings(updateSettings: Partial<LoanSettings>): Promise<LoanSettings> {
    const settings = await this.getSettings();
    Object.assign(settings, updateSettings);
    return this.loanSettingsRepository.save(settings);
  }
}
