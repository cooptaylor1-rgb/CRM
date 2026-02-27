import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

/**
 * updateSession
 *
 * Next.js middleware helper that refreshes the Supabase session token on every
 * request so it does not expire while the user is active.
 *
 * Also enforces basic authentication routing:
 *   - Unauthenticated users are redirected to `/login` unless they are already
 *     on a `/login` or `/auth` path.
 *   - All other requests pass through with an updated `Set-Cookie` header.
 *
 * This function is called from `frontend/middleware.ts`; do not call it
 * directly from application code.
 *
 * @param request - The incoming Next.js request.
 * @returns A NextResponse, potentially with refreshed session cookies or a redirect.
 */
export async function updateSession(request: NextRequest): Promise<NextResponse> {
  /**
   * We start with a default pass-through response.
   * The Supabase SSR client will mutate this variable via `setAll` to attach
   * any refreshed session cookies before we return it.
   */
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        /** Reads all cookies from the incoming request. */
        getAll() {
          return request.cookies.getAll();
        },

        /**
         * Writes refreshed cookies to both the request (for downstream
         * middleware) and the response (so the browser updates its store).
         */
        setAll(cookiesToSet) {
          // Apply to request object first
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          );

          // Re-create the response with the mutated request so cookies flow
          // correctly to the browser
          supabaseResponse = NextResponse.next({ request });

          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  /**
   * IMPORTANT: Do not run arbitrary logic between createServerClient and
   * supabase.auth.getUser(). A session refresh can happen at any point,
   * and it must be able to set cookies synchronously in the setAll callback.
   */
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;
  const isPublicRoute =
    pathname.startsWith('/login') || pathname.startsWith('/auth');

  if (!user && !isPublicRoute) {
    // Redirect unauthenticated users to the login page
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}
