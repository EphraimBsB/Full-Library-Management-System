import {
  Injectable,
  UnauthorizedException,
  NotFoundException,
  BadRequestException,
  Inject,
  forwardRef,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { UsersService } from '../users/users.service';
import { LoginDto } from './dto/login.dto';
import { CreateUserDto } from '../users/dto/create-user.dto';
import { StudentsService } from '../auth/students/students.service';
import * as bcrypt from 'bcrypt';
import { MembershipStatus } from 'src/membership/membership.service';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like } from 'typeorm';
import { MembershipType } from '../sys-configs/membership-types/entities/membership-type.entity';

@Injectable()
export class AuthService {
  constructor(
    @Inject(forwardRef(() => UsersService))
    private usersService: UsersService,
    private jwtService: JwtService,
    private httpService: HttpService,
    @Inject(forwardRef(() => StudentsService))
    private studentsService: StudentsService,
    @InjectRepository(MembershipType)
    private readonly membershipTypeRepository: Repository<MembershipType>,
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

    if (!password) {
      throw new UnauthorizedException('Password is required');
    }

    // Simple user validation - no auto-registration
    const user = await this.usersService.validateUser(identifier, password);

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Check if email is verified (students only)
    console.log('User role:', user.role.name);
    if (user.role.name !== 'Admin' && user.role.name !== 'Librarian') {
      const isEmailVerified =
        await this.usersService.checkEmailVerificationStatus(user.id);
      if (!isEmailVerified) {
        throw new UnauthorizedException(
          'Email not verified. Please verify your email first.',
        );
      }
    }

    // Check if the user account itself is active (e.g. not banned or disabled)
    if (user.isActive === false) {
      throw new UnauthorizedException(
        'Your account has been deactivated. Please contact an administrator.',
      );
    }

    const payload = {
      email: user.email,
      sub: user.id,
      role: user.role?.name,
    };

    const token = this.jwtService.sign(payload);

    const result = {
      access_token: token,
      user: {
        id: user.id,
        avatarUrl: user.avatarUrl,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        rollNumber: user.rollNumber,
        degree: user.degree,
        semester: user.semester,
        role: user.role,
        isActive: user.isActive,
      },
    };

    return result;
  }

  async registerStudent(createUserDto: CreateUserDto) {
    const {
      rollNumber,
      password,
      firstName,
      lastName,
      email,
      phoneNumber,
      degree,
      semester,
    } = createUserDto;

    if (!rollNumber || !password) {
      throw new UnauthorizedException('Roll number and password are required');
    }

    try {


      // Check if user already exists
      const existingUser = await this.usersService.findByRollNumber(rollNumber);
      if (existingUser) {
        throw new BadRequestException(
          'A user with this roll number is already registered. Please try logging in or use a different roll number.',
        );
      }

      // Check if email already exists (if email is provided)
      if (email) {
        const existingEmailUser = await this.usersService.findByEmail(email);
        if (existingEmailUser) {
          throw new BadRequestException(
            'A user with this email is already registered. Please use a different email or try logging in.',
          );
        }
      }

      // Check if student exists in the university's system via third-party API
      const verification = await this.verifyStudent(rollNumber);
      if (!verification.result) {
        throw new BadRequestException(
          'Invalid roll number. This student is not registered at ISBAT University.',
        );
      }

      // Check membership status
      const membershipResult = await this.checkMembership(rollNumber);
      const isActive = membershipResult.result === true;
      const membershipStatus = isActive ? 'Active' : 'Inactive';

      // Hash password
      const hashedPassword = await bcrypt.hash(password, 10);

      // Determine the appropriate membership type based on the program (degree)
      // We assume ID 1 is for UG (Undergraduate) and ID 2 is for PG (Postgraduate)
      let assignedMembershipTypeId = 1;
      const degreeLower = degree ? degree.toLowerCase() : '';
      
      if (
        degreeLower.includes('master') ||
        degreeLower.includes('postgraduate') ||
        degreeLower.includes('pg ') ||
        degreeLower.includes('-pg') ||
        degreeLower.includes('msc') ||
        degreeLower.includes('mba') ||
        degreeLower.includes('phd')
      ) {
        assignedMembershipTypeId = 2;
      }

      // Prepare createMember data
      const createMemberData = {
        firstName: firstName || '',
        lastName: lastName || '',
        email: email || '',
        rollNumber: rollNumber,
        password: hashedPassword,
        phoneNumber: phoneNumber || '',
        degree: degree || '',
        semester: semester || '', // ✅ Semester saved
        membershipTypeId: assignedMembershipTypeId, // Dynamically assigned based on program
        membershipStatus: membershipStatus, // ✅ Pass Active/Inactive status based on checkMembership result
        roleId: 3, // MEMBER role
        isActive: false, // Account requires email verification
      };

      // Use createMember to create user with proper role and membership
      const newUser = await this.usersService.createMember(createMemberData);

      // Send email verification
      await this.usersService.sendEmailVerification(newUser.id, isActive);

      let message =
        'Registration successful! Please check your email to verify your account.';
      if (!isActive) {
        message +=
          ' IMPORTANT: Our records indicate you have not paid the library fee. You will not be able to borrow books until the fee is paid at the University Finance Office.';
      }

      // Return success message (no auto-login until email is verified)
      return {
        message,
        requiresEmailVerification: true,
        user: {
          id: newUser.id,
          email: newUser.email || `${rollNumber}@isbat.edu`,
          firstName: newUser.firstName,
          lastName: newUser.lastName,
          rollNumber: newUser.rollNumber,
          degree: newUser.degree,
          semester: newUser.semester,
          role: newUser.role,
          isActive: false, // Account is inactive until email verification
          membershipStatus: membershipStatus,
        },
      };
    } catch (error) {
      // Re-throw BadRequestException and UnauthorizedException as-is
      if (
        error instanceof BadRequestException ||
        error instanceof UnauthorizedException
      ) {
        throw error;
      }
      // Wrap other errors in a more user-friendly message
      throw new BadRequestException(`Registration failed: ${error.message}`);
    }
  }

  async verifyStudent(rollNumber: string) {
    let retryCount = 0;
    const maxRetries = 3;

    while (retryCount < maxRetries) {
      try {
        // First check if student is registered
        const registeredResponse = await firstValueFrom(
          this.httpService.get(
            'https://ilimsapi.isbatuniversity.ac.ug:9093/api/RegisteredStudent',
            {
              params: { rollno: rollNumber },
              timeout: 10000, // Reduced timeout
              headers: {
                'User-Agent': 'ISBAT-LMS/1.0',
                Connection: 'keep-alive',
                Accept: 'application/json',
              },
            },
          ),
        );

        let resultData = registeredResponse.data;
        if (typeof resultData === 'string') {
          try {
            resultData = JSON.parse(resultData);
          } catch (e) {
            // parsing failed
          }
        }

        if (resultData.result === false || resultData.result === 'false') {
          return { result: false };
        }

        // If registered, get student details
        const detailsResponse = await firstValueFrom(
          this.httpService.get(
            'https://ilimsapi.isbatuniversity.ac.ug:9093/api/StudentDetails',
            {
              params: { rollno: rollNumber },
              timeout: 10000, // Reduced timeout
              headers: {
                'User-Agent': 'ISBAT-LMS/1.0',
                Connection: 'keep-alive',
                Accept: 'application/json',
              },
            },
          ),
        );

        let detailsData = detailsResponse.data;
        if (typeof detailsData === 'string') {
          try {
            detailsData = JSON.parse(detailsData);
          } catch (e) {}
        }

        return {
          result: true,
          ...detailsData,
        };
      } catch (error) {
        retryCount++;
        console.error(`Attempt ${retryCount} failed:`, error.message);

        if (retryCount >= maxRetries) {
          // For network errors, provide a fallback response
          if (
            error.code === 'ECONNRESET' ||
            error.code === 'ENOTFOUND' ||
            error.message?.includes('forcibly closed')
          ) {
            return {
              result: true,
              name: 'Student Name', // Fallback
              programme: 'Bachelor Program', // Fallback
              semester: 'Current Semester', // Fallback
              fallback: true, // Indicate this is fallback data
            };
          }
          throw new Error(
            `Failed to verify student after ${maxRetries} attempts: ${error.message}`,
          );
        }

        // Wait before retry
        await new Promise((resolve) => setTimeout(resolve, 1000 * retryCount));
      }
    }
  }

  async checkMembership(rollNumber: string) {
    let retryCount = 0;
    const maxRetries = 3;

    while (retryCount < maxRetries) {
      try {
        const response = await firstValueFrom(
          this.httpService.get(
            'https://ilimsapi.isbatuniversity.ac.ug:9093/api/LibMember',
            {
              params: { rollno: rollNumber },
              timeout: 10000, // Reduced timeout
              headers: {
                'User-Agent': 'ISBAT-LMS/1.0',
                Connection: 'keep-alive',
                Accept: 'application/json',
              },
            },
          ),
        );

        let resultData = response.data;
        if (typeof resultData === 'string') {
          try {
            const parsed = JSON.parse(resultData);
            resultData = parsed;
          } catch (e) {
            resultData = { result: false };
          }
        }

        // Ensure result is boolean
        if (resultData && typeof resultData.result === 'string') {
          resultData.result = resultData.result === 'true';
        }

        return resultData;
      } catch (error) {
        retryCount++;
        console.error(
          `Membership check attempt ${retryCount} failed:`,
          error.message,
        );

        if (retryCount >= maxRetries) {
          // For network errors, provide a fallback response
          if (
            error.code === 'ECONNRESET' ||
            error.code === 'ENOTFOUND' ||
            error.message?.includes('forcibly closed')
          ) {
            return {
              result: false, // Default to inactive membership
              fallback: true, // Indicate this is fallback data
            };
          }
          throw new Error(
            `Failed to check membership after ${maxRetries} attempts: ${error.message}`,
          );
        }

        // Wait before retry
        await new Promise((resolve) => setTimeout(resolve, 1000 * retryCount));
      }
    }
  }
}
