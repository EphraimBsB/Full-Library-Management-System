import { Controller, Get, Put, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { LoanSettings } from './loan-settings.entity';
import { LoanSettingsService } from './loan-settings.service';
import { UpdateLoanSettingsDto } from './dto/update-loan-settings.dto';
import { UserRole } from 'src/common/enums/user-role.enum';

@ApiTags('loan-settings')
@Controller('api/loan-settings')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN, UserRole.LIBRARIAN)
export class LoanSettingsController {
  constructor(private readonly loanSettingsService: LoanSettingsService) {}

  @Get()
  @ApiOperation({ summary: 'Get current loan settings' })
  @ApiResponse({ status: 200, description: 'Returns the current loan settings', type: LoanSettings })
  async getSettings(): Promise<LoanSettings> {
    return this.loanSettingsService.getSettings();
  }

  @Put()
  @ApiOperation({ summary: 'Update loan settings' })
  @ApiResponse({ status: 200, description: 'Updates and returns the loan settings', type: LoanSettings })
  async updateSettings(
    @Body() updateSettingsDto: UpdateLoanSettingsDto,
  ): Promise<LoanSettings> {
    return this.loanSettingsService.updateSettings(updateSettingsDto);
  }
}
