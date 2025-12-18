import { Injectable, UnauthorizedException, NotFoundException, Inject, forwardRef } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';
import { LoginDto } from './dto/login.dto';
import { StudentsService } from '../auth/students/students.service';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
    @Inject(forwardRef(() => StudentsService))
    private studentsService: StudentsService,
  ) {}

  async validateUser(email: string, password: string): Promise<any> {
    const user = await this.usersService.findByEmail(email);
    if (user && (await bcrypt.compare(password, user.passwordHash))) {
      const { passwordHash, ...result } = user;
      return result;
    }
    return null;
  }

  async login(loginDto: LoginDto) {
    const { email, rollNumber, password } = loginDto;
    const identifier = email || rollNumber;

    if (!identifier) {
      throw new UnauthorizedException('Email or roll number is required');
    }

    console.log(`Login attempt with identifier: ${identifier}`);

    // Try to validate existing user first
    let user = await this.usersService.validateUser(identifier, password);

    // If user doesn't exist and roll number is provided, try auto-registration
    if (!user && rollNumber) {
      console.log(`User not found, attempting auto-registration for roll number: ${rollNumber}`);
      
      try {
        // Get student details from third-party API
        const studentDetails = await this.studentsService.getStudentDetails(rollNumber);
        console.log(`Student details retrieved for roll number: ${rollNumber}`);

        // Check if the provided password matches the roll number (default password for auto-registered students)
        if (password !== rollNumber) {
          throw new UnauthorizedException('Invalid credentials. For auto-registered students, password should be your roll number');
        }

        // Create user from student details
        user = await this.usersService.createStudentFromThirdParty(studentDetails, rollNumber);
        console.log(`Auto-registered user created for roll number: ${rollNumber}`);

        // Re-validate the newly created user
        user = await this.usersService.validateUser(identifier, password);
        if (!user) {
          throw new UnauthorizedException('Failed to validate auto-registered user');
        }

      } catch (error) {
        console.log(`Auto-registration failed for roll number: ${rollNumber}`, error.message);
        throw new UnauthorizedException('Invalid credentials or student not found in university system');
      }
    }

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const payload = { 
      email: user.email, 
      sub: user.id,
      role: user.role?.name // Access the role name from the relation
    };

    return {
      access_token: this.jwtService.sign(payload),
      user: {
        id: user.id,
        avatarUrl: user.avatarUrl,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        rollNumber: user.rollNumber,
        degree: user.degree,
        role: user.role,
        isActive: user.isActive,
      },
    };
  }
}
