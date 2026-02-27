import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { User } from '@supabase/supabase-js';

/**
 * CurrentUser
 *
 * Parameter decorator that extracts the authenticated Supabase User (or a
 * specific field from it) from the current request context.
 *
 * Prerequisites: SupabaseAuthGuard must be applied to the route so that
 * `request.user` is populated before this decorator is evaluated.
 *
 * Examples:
 * ```ts
 * // Inject the full User object
 * @Get('me')
 * @UseGuards(SupabaseAuthGuard)
 * getMe(@CurrentUser() user: User) { ... }
 *
 * // Inject a specific field (e.g. the user's UUID)
 * @Get('me/id')
 * @UseGuards(SupabaseAuthGuard)
 * getMyId(@CurrentUser('id') userId: string) { ... }
 * ```
 */
export const CurrentUser = createParamDecorator(
  (data: keyof User | string | undefined, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest<{ user?: User }>();
    const user = request.user;
    return data ? user?.[data as keyof User] : user;
  },
);
