import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  SetMetadata,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import type { Request } from 'express';
import type { AdminRole } from '@kaza/shared';

export const ADMIN_ROLES_KEY = 'admin-roles';

/** Restricts a route to specific back-office roles (§G8). Super-admin always passes. */
export const RequireRoles = (...roles: AdminRole[]) => SetMetadata(ADMIN_ROLES_KEY, roles);

export interface AdminRequest extends Request {
  adminId: string;
  adminRole: AdminRole;
}

@Injectable()
export class AdminAuthGuard implements CanActivate {
  constructor(
    private readonly jwtService: JwtService,
    private readonly reflector: Reflector,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<AdminRequest>();
    const token = request.headers.authorization?.replace(/^Bearer /, '');
    if (!token) {
      throw new UnauthorizedException('Missing admin token');
    }

    let payload: { sub: string; role: AdminRole; scope: string };
    try {
      payload = await this.jwtService.verifyAsync(token);
    } catch {
      throw new UnauthorizedException('Invalid or expired admin token');
    }
    if (payload.scope !== 'admin') {
      throw new UnauthorizedException('Not an admin token');
    }

    const requiredRoles = this.reflector.getAllAndOverride<AdminRole[] | undefined>(ADMIN_ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (requiredRoles?.length && payload.role !== 'super-admin' && !requiredRoles.includes(payload.role)) {
      throw new ForbiddenException('Insufficient role');
    }

    request.adminId = payload.sub;
    request.adminRole = payload.role;
    return true;
  }
}
