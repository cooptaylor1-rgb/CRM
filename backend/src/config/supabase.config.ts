import { registerAs } from '@nestjs/config';

/**
 * Supabase configuration factory.
 * Registers all Supabase-related environment variables under the 'supabase' namespace.
 * Access via ConfigService.get<SupabaseConfig>('supabase').
 */
export default registerAs('supabase', () => ({
  url: process.env.SUPABASE_URL,
  anonKey: process.env.SUPABASE_ANON_KEY,
  serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY,
  jwtSecret: process.env.SUPABASE_JWT_SECRET,
}));
