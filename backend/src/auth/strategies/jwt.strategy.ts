import {
  ForbiddenException,
  Injectable,
  UnauthorizedException,
  Logger,
} from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { UsersService } from '../../users/users.service';
import { User } from '../../users/entities/user.entity';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  private readonly logger = new Logger(JwtStrategy.name);

  constructor(private readonly usersService: UsersService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_SECRET || 'your-secret-key', // In production, use environment variables
    });
  }

  async validate(
    payload: any,
  ): Promise<User> {
    // this.logger.log(`JWT validation for user ID: ${payload.sub}`);
    
    const user = await this.usersService.findOne(payload.sub);

    if (!user) {
      this.logger.error(`User not found for ID: ${payload.sub}`);
      throw new UnauthorizedException('User not found');
    }

    if (!user.role) {
      this.logger.error(`No role found for user: ${user.id}`);
      throw new ForbiddenException('No user role found');
    }

    // Log the role object for debugging
    // this.logger.log(`User found: ${user.id}, Role object: ${JSON.stringify(user.role)}, Role name: ${user.role.name}`);

    return user;
  }
}
