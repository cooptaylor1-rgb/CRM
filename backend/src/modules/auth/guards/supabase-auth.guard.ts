import {
  CanActivate,
  ExecutionContext,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { Request } from 'express';
import { SupabaseService } from '../../supabase/supabase.service';

/**
 * SupabaseAuthGuard
 *
 * A NestJS guard that authenticates requests using Supabase-issued JWTs.
 *
 * Flow:
 *   1. Extracts the Bearer token from the `Authorization` header.
 *   2. Validates the token against Supabase via `auth.getUser(token)`.
 *   3. Attaches the authenticated Supabase User to `request.user`.
 *   4. Throws 401 Unauthorized for any of the following:
 *      - Missing / malformed Authorization header
 *      - Expired token
 *      - Invalid / tampered token
 *      - Network / Supabase API error
 *
 * Usage:
 * ```ts
 * @UseGuards(SupabaseAuthGuard)
 * @Get('profile')
 * getProfile(@CurrentUser() user: User) { ... }
 * ```
 */
@Injectable()
export class SupabaseAuthGuard implements CanActivate {
  private readonly logger = new Logger(SupabaseAuthGuard.name);

  constructor(private readonly supabaseService: SupabaseService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();
    const token = this.extractToken(request);

    if (!token) {
      this.logger.debug('Request rejected: missing or malformed Authorization header.');
      throw new UnauthorizedException(
        'Missing authorization token. Provide a Bearer token in the Authorization header.',
      );
    }

    try {
      const user = await this.supabaseService.getUser(token);
      // Attach validated user to the request for downstream handlers / guards
      (request as Request & { user: unknown }).user = user;
      return true;
    } catch (err) {
      // Re-throw UnauthorizedException as-is so the client receives the precise message
      if (err instanceof UnauthorizedException) {
        throw err;
      }

      // Unexpected errors (network timeouts, etc.) – log and return generic 401
      this.logger.error('Unexpected error during Supabase token validation', err);
      throw new UnauthorizedException(
        'Authentication failed due to an internal error. Please try again.',
      );
    }
  }

  /**
   * Extracts the Bearer token from the Authorization header.
   *
   * @param request - The incoming HTTP request.
   * @returns The raw JWT string, or null if absent / malformed.
   */
  private extractToken(request: Request): string | null {
    const authHeader = request.headers['authorization'];

    if (!authHeader || typeof authHeader !== 'string') {
      return null;
    }

    const parts = authHeader.split(' ');

    // Must be exactly "Bearer <token>"
    if (parts.length !== 2 || parts[0].toLowerCase() !== 'bearer') {
      this.logger.debug(
        `Malformed Authorization header received: "${authHeader.slice(0, 30)}..."`,
      );
      return null;
    }

    const token = parts[1].trim();
    return token.length > 0 ? token : null;
  }
}
