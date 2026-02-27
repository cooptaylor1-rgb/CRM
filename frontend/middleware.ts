import { updateSession } from '@/lib/supabase/middleware';
import { type NextRequest } from 'next/server';

/**
 * Next.js Middleware entry point.
 *
 * Delegates session refresh and authentication routing to `updateSession`.
 * Runs on every request that matches the `config.matcher` pattern below.
 *
 * Excluded from matching:
 *   - `_next/static`  – static build assets
 *   - `_next/image`   – Next.js image optimisation endpoint
 *   - `favicon.ico`   – browser favicon
 *   - Common image extensions (svg, png, jpg, jpeg, gif, webp)
 *
 * @param request - The incoming Next.js request.
 */
export async function middleware(request: NextRequest) {
  return await updateSession(request);
}

export const config = {
  matcher: [
    /*
     * Match all request paths EXCEPT:
     *   - _next/static  (static files)
     *   - _next/image   (image optimisation files)
     *   - favicon.ico   (favicon file)
     *   - Files with common image extensions
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
