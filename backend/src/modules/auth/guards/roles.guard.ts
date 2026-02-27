import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { User } from '@supabase/supabase-js';
import { Request } from 'express';
import { SupabaseService } from '../../supabase/supabase.service';
import { ROLES_KEY } from '../decorators/roles.decorator';

/** Valid application roles for the Wealth Management CRM. */
export type AppRole =
  | 'admin'
  | 'advisor'
  | 'compliance_officer'
  | 'analyst'
  | 'read_only';

/**
 * RolesGuard
 *
 * Enforces role-based access control (RBAC) for NestJS route handlers.
 * Must be used **after** SupabaseAuthGuard so that `request.user` is already
 * populated with the authenticated Supabase User.
 *
 * Role resolution:
 *   1. Reads the required roles from the `@Roles()` decorator metadata.
 *   2. Fetches the user's profile row from the `profiles` table via SupabaseService.
 *   3. Compares the profile role against the required roles.
 *   4. Returns 403 Forbidden if the role does not match.
 *
 * Usage:
 * ```ts
 * @UseGuards(SupabaseAuthGuard, RolesGuard)
 * @Roles('admin', 'compliance_officer')
 * @Get('sensitive-data')
 * getSensitiveData() { ... }
 * ```
 */
@Injectable()
export class RolesGuard implements CanActivate {
  private readonly logger = new Logger(RolesGuard.name);

  constructor(
    private readonly reflector: Reflector,
    private readonly supabaseService: SupabaseService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    // Retrieve required roles from @Roles() decorator (handler first, then class)
    const requiredRoles = this.reflector.getAllAndOverride<AppRole[]>(
      ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );

    // No @Roles() decorator – allow all authenticated users
    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest<Request & { user?: User }>();
    const user = request.user;

    if (!user) {
      // SupabaseAuthGuard should have already blocked this; guard against misuse
      throw new UnauthorizedException(
        'User is not authenticated. Ensure SupabaseAuthGuard runs before RolesGuard.',
      );
    }

    // Fetch the user's profile to read their assigned role
    const profile = await this.supabaseService.getUserProfile(user.id);

    if (!profile) {
      this.logger.warn(
        `No profile found for user ${user.id}. Denying access (required roles: ${requiredRoles.join(', ')}).`,
      );
      throw new ForbiddenException(
        'User profile not found. Contact an administrator.',
      );
    }

    const userRole = profile.role as AppRole | undefined;

    if (!userRole) {
      this.logger.warn(
        `Profile for user ${user.id} has no role set. Denying access.`,
      );
      throw new ForbiddenException(
        'Your account does not have a role assigned. Contact an administrator.',
      );
    }

    const hasRole = requiredRoles.includes(userRole);

    if (!hasRole) {
      this.logger.debug(
        `Access denied for user ${user.id}: role "${userRole}" is not in [${requiredRoles.join(', ')}].`,
      );
      throw new ForbiddenException(
        `Access denied. Required role(s): ${requiredRoles.join(' or ')}. Your role: ${userRole}.`,
      );
    }

    this.logger.debug(
      `Access granted for user ${user.id} with role "${userRole}".`,
    );
    return true;
  }
}
