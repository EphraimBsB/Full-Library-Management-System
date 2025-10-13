import { Controller, Post, Body, HttpStatus, HttpCode, UseGuards } from '@nestjs/common';
import { EmailService } from './email.service';
import { TestEmailDto } from './dto/test-email.dto';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { Public } from 'src/auth/decorators/public.decorator';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { RolesGuard } from 'src/auth/guards/roles.guard';

@ApiTags('Email')
@Controller('email')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('email')
export class EmailController {
  constructor(private readonly emailService: EmailService) {}

  @Post('test')
  @HttpCode(HttpStatus.ACCEPTED)
  @Public()
  @ApiOperation({ summary: 'Send a test email' })
  @ApiResponse({ status: 202, description: 'Test email sent successfully' })
  @ApiResponse({ status: 400, description: 'Invalid request' })
  @ApiResponse({ status: 500, description: 'Failed to send email' })
  async sendTestEmail(@Body() testEmailDto: TestEmailDto) {
    const now = new Date().toLocaleString();
    
    await this.emailService.sendEmail(
      testEmailDto.to,
      'Test Email from Library System',
      'test-email',
      {
        name: testEmailDto.name,
        now,
      }
    );

    return {
      status: 'success',
      message: 'Test email sent successfully',
      data: {
        to: testEmailDto.to,
        sentAt: now,
      },
    };
  }
}
