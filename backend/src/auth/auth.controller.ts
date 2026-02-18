import {
  Controller,
  Post,
  Body,
  UseGuards,
  Get,
  Request,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { CreateUserDto } from '../users/dto/create-user.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { Public } from './decorators/public.decorator';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  @Public()
  @ApiOperation({ summary: 'User login' })
  @ApiResponse({ status: 200, description: 'Successfully logged in' })
  @ApiResponse({ status: 401, description: 'Invalid credentials' })
  async login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto);
  }

  @Post('register-student')
  @Public()
  @ApiOperation({ summary: 'Register student with roll number' })
  @ApiResponse({ status: 201, description: 'Student registered successfully' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  async registerStudent(@Body() createUserDto: CreateUserDto) {
    return this.authService.registerStudent(createUserDto);
  }

  @Post('verify-student')
  @Public()
  @ApiOperation({ summary: 'Verify student registration with university' })
  @ApiResponse({ status: 200, description: 'Student verification completed' })
  async verifyStudent(@Body() body: { rollNumber: string }) {
    return this.authService.verifyStudent(body.rollNumber);
  }

  @Post('check-membership')
  @Public()
  @ApiOperation({ summary: 'Check library membership status' })
  @ApiResponse({ status: 200, description: 'Membership check completed' })
  async checkMembership(@Body() body: { rollNumber: string }) {
    return this.authService.checkMembership(body.rollNumber);
  }

  @UseGuards(JwtAuthGuard)
  @Get('profile')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get user profile' })
  @ApiResponse({ status: 200, description: 'Profile retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  getProfile(@Request() req) {
    // The user object is attached to the request by the JWT strategy
    const user = req.user;
    // Don't return sensitive information like password hashes
    const { passwordHash, ...result } = user;
    return result;
  }
}
