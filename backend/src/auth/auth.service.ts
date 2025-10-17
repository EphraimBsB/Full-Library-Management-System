import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';
import { LoginDto } from './dto/login.dto';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
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
    const user = await this.usersService.findByEmail(loginDto.email);
    
    if (!user || !(await bcrypt.compare(loginDto.password, user.passwordHash))) {
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
        role: user.role
      }
    };
  }
}
