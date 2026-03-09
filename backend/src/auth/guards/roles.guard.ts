import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from '../decorators/roles.decorator';
import { UserRole } from '../../common/enums/user-role.enum';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<UserRole[]>(
      ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!requiredRoles) {
      return true;
    }

    const { user } = context.switchToHttp().getRequest();

    if (!user) {
      throw new ForbiddenException('No user found');
    }

    if (!user.role) {
      throw new ForbiddenException('No user role found');
    }

    // Log for debugging - handle both string and object role
    let userRole: string;
    if (typeof user.role === 'string') {
      userRole = user.role;
    } else if (user.role && typeof user.role === 'object' && user.role.name) {
      userRole = user.role.name;
    } else {
      // console.log(`RolesGuard: Unexpected role structure: ${JSON.stringify(user.role)}`);
      throw new ForbiddenException('Invalid role structure');
    }

    // console.log(`RolesGuard: User role is '${userRole}', required roles are: ${requiredRoles.join(', ')}`);

    const hasRole = requiredRoles.some((role) => {
      // console.log(`Checking if user.role '${userRole}' === requiredRole '${role}': ${userRole === role}`);
      // Case-insensitive comparison
      return userRole.toLowerCase() === role.toLowerCase();
    });

    if (!hasRole) {
      throw new ForbiddenException(`Access denied. Required roles: ${requiredRoles.join(', ')}. User role: ${userRole}`);
    }

    return true;
  }
}
