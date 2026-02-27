import { createBrowserClient } from '@supabase/ssr';

/**
 * createClient
 *
 * Returns a Supabase browser client configured for use in Next.js Client
 * Components, event handlers, and other browser-side code.
 *
 * The client is recreated on each call — if you need a singleton across
 * multiple components, create it once at the top of your component tree and
 * pass it via context, or memoize with `useMemo`.
 *
 * Environment variables required:
 *   - NEXT_PUBLIC_SUPABASE_URL       – your Supabase project URL
 *   - NEXT_PUBLIC_SUPABASE_ANON_KEY  – your Supabase project anon key
 *
 * Usage:
 * ```ts
 * const supabase = createClient();
 * const { data, error } = await supabase.auth.signInWithPassword({ email, password });
 * ```
 */
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
}
