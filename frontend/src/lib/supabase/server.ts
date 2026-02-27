import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

/**
 * createClient (server)
 *
 * Returns a Supabase client configured for use in Next.js Server Components,
 * Server Actions, and Route Handlers.
 *
 * Reads and writes session cookies from the Next.js `cookies()` store.
 * Cookie writes in Server Components are silently ignored (read-only context),
 * which is the expected behaviour — session refreshes must be handled by the
 * middleware (`updateSession`) or a Server Action / Route Handler instead.
 *
 * Environment variables required:
 *   - NEXT_PUBLIC_SUPABASE_URL       – your Supabase project URL
 *   - NEXT_PUBLIC_SUPABASE_ANON_KEY  – your Supabase project anon key
 *
 * Usage:
 * ```ts
 * // Inside a Server Component or Server Action:
 * const supabase = await createClient();
 * const { data: { user } } = await supabase.auth.getUser();
 * ```
 */
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        /**
         * Returns all cookies from the Next.js cookie store.
         * Required by @supabase/ssr to read the current session.
         */
        getAll() {
          return cookieStore.getAll();
        },

        /**
         * Writes cookies back to the Next.js cookie store.
         * This will silently no-op inside Server Components (read-only),
         * but will work correctly inside Server Actions and Route Handlers.
         */
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options),
            );
          } catch {
            // The `set` method was called from a Server Component.
            // This is expected — session refreshes are handled by middleware.
          }
        },
      },
    },
  );
}
