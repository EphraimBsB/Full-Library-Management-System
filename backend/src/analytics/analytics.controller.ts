import { Controller, Post, Get, Body, Req } from '@nestjs/common';
import { AnalyticsService } from './analytics.service';
import { CreateVisitDto } from './dto/create-visit.dto';
import type { Request } from 'express';
import { Public } from '../auth/decorators/public.decorator';

@Controller('analytics')
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Public()
  @Post('visit')
  async trackVisit(
    @Body() createVisitDto: CreateVisitDto,
    @Req() req: Request,
  ) {
    const ip = req.ip || req.connection.remoteAddress || '';
    return this.analyticsService.trackVisit(createVisitDto, ip);
  }

  // Optional: protect this with @Roles('admin') if needed, for now let's just make it accessible to logged in users
  @Get('dashboard')
  async getDashboardStats() {
    return this.analyticsService.getDashboardStats();
  }

  @Get('visits')
  async getRecentVisits() {
    return this.analyticsService.getRecentVisits(200);
  }
}

