import {
  Injectable,
  Logger,
  OnModuleInit,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  createClient,
  SupabaseClient,
  User,
} from '@supabase/supabase-js';

/** Shape of the Supabase config namespace. */
interface SupabaseConfig {
  url: string;
  anonKey: string;
  serviceRoleKey: string;
  jwtSecret: string;
}

/** Shape returned by the profiles table. */
export interface UserProfile {
  id: string;
  role: string;
  email: string;
  full_name?: string;
  created_at?: string;
  updated_at?: string;
  [key: string]: unknown;
}

/**
 * SupabaseService
 *
 * Central service for all Supabase interactions in the NestJS backend.
 * Provides two singleton clients:
 *   - anon client  – uses the public anon key (respects Row Level Security)
 *   - admin client – uses the service-role key (bypasses RLS; backend-only)
 *
 * Verifies connectivity on module initialisation and surfaces clear errors
 * if required environment variables are missing.
 */
@Injectable()
export class SupabaseService implements OnModuleInit {
  private readonly logger = new Logger(SupabaseService.name);

  /** Singleton anon-key client (respects RLS). */
  private anonClient: SupabaseClient | null = null;

  /** Singleton service-role client (bypasses RLS – never expose to frontend). */
  private adminClient: SupabaseClient | null = null;

  private readonly supabaseUrl: string;
  private readonly anonKey: string;
  private readonly serviceRoleKey: string;

  constructor(private readonly configService: ConfigService) {
    this.supabaseUrl = this.configService.get<string>('supabase.url') ?? '';
    this.anonKey = this.configService.get<string>('supabase.anonKey') ?? '';
    this.serviceRoleKey =
      this.configService.get<string>('supabase.serviceRoleKey') ?? '';

    this.validateConfig();
  }

  // ---------------------------------------------------------------------------
  // Lifecycle
  // ---------------------------------------------------------------------------

  /**
   * Called automatically by NestJS after the module is fully initialised.
   * Performs a lightweight connectivity check so misconfiguration surfaces
   * at startup rather than at the first request.
   */
  async onModuleInit(): Promise<void> {
    await this.verifyConnection();
  }

  // ---------------------------------------------------------------------------
  // Public accessors
  // ---------------------------------------------------------------------------

  /**
   * Returns the shared anon-key Supabase client.
   * Lazily initialised on first call and cached thereafter.
   */
  getClient(): SupabaseClient {
    if (!this.anonClient) {
      this.anonClient = createClient(this.supabaseUrl, this.anonKey, {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
          detectSessionInUrl: false,
        },
      });
      this.logger.debug('Anon Supabase client created.');
    }
    return this.anonClient;
  }

  /**
   * Returns the shared service-role (admin) Supabase client.
   * This client bypasses Row Level Security – use only in backend logic,
   * never forward this client or its credentials to the frontend.
   */
  getAdminClient(): SupabaseClient {
    if (!this.adminClient) {
      this.adminClient = createClient(this.supabaseUrl, this.serviceRoleKey, {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
          detectSessionInUrl: false,
        },
      });
      this.logger.debug('Admin Supabase client created.');
    }
    return this.adminClient;
  }

  /**
   * Validates a JWT issued by Supabase and returns the associated User object.
   *
   * @param jwt - Bearer token extracted from the Authorization header.
   * @throws UnauthorizedException if the token is missing, expired, or invalid.
   */
  async getUser(jwt: string): Promise<User> {
    if (!jwt || jwt.trim() === '') {
      throw new UnauthorizedException('No JWT token provided.');
    }

    try {
      const { data, error } = await this.getClient().auth.getUser(jwt);

      if (error) {
        this.logger.warn(`Supabase auth.getUser failed: ${error.message}`);
        throw new UnauthorizedException(
          `Token validation failed: ${error.message}`,
        );
      }

      if (!data.user) {
        throw new UnauthorizedException('User not found for provided token.');
      }

      return data.user;
    } catch (err) {
      if (err instanceof UnauthorizedException) throw err;

      this.logger.error('Unexpected error validating Supabase JWT', err);
      throw new UnauthorizedException(
        'Unable to validate authentication token.',
      );
    }
  }

  /**
   * Fetches a user's profile row from the `profiles` table.
   * Uses the admin client so it is not blocked by RLS policies.
   *
   * @param userId - UUID of the user (matches auth.users.id).
   * @returns The profile row, or null if none exists.
   */
  async getUserProfile(userId: string): Promise<UserProfile | null> {
    if (!userId) {
      this.logger.warn('getUserProfile called with empty userId.');
      return null;
    }

    try {
      const { data, error } = await this.getAdminClient()
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        // PGRST116 = row not found; treat as null rather than an error
        if (error.code === 'PGRST116') {
          this.logger.debug(`No profile found for user ${userId}.`);
          return null;
        }
        this.logger.error(
          `Failed to fetch profile for user ${userId}: ${error.message}`,
        );
        return null;
      }

      return data as UserProfile;
    } catch (err) {
      this.logger.error(
        `Unexpected error fetching profile for user ${userId}`,
        err,
      );
      return null;
    }
  }

  // ---------------------------------------------------------------------------
  // Private helpers
  // ---------------------------------------------------------------------------

  /**
   * Validates that all required environment variables are present.
   * Throws a descriptive error at startup if any are missing.
   */
  private validateConfig(): void {
    const missing: string[] = [];

    if (!this.supabaseUrl) missing.push('SUPABASE_URL');
    if (!this.anonKey) missing.push('SUPABASE_ANON_KEY');
    if (!this.serviceRoleKey) missing.push('SUPABASE_SERVICE_ROLE_KEY');

    if (missing.length > 0) {
      throw new Error(
        `Supabase configuration is incomplete. Missing env vars: ${missing.join(', ')}. ` +
          'Check your .env file and ensure all SUPABASE_* variables are set.',
      );
    }
  }

  /**
   * Performs a lightweight connectivity test against the Supabase project.
   * Logs a warning on failure but does not crash the application so that
   * partial-connectivity scenarios (e.g. cold-start networking) are tolerated.
   */
  private async verifyConnection(): Promise<void> {
    try {
      // Attempt a no-op auth call to confirm the project URL and anon key are valid
      const { error } = await this.getClient().auth.getSession();

      if (error) {
        this.logger.warn(
          `Supabase connectivity check returned an error: ${error.message}`,
        );
      } else {
        this.logger.log(
          `Supabase connected successfully to ${this.supabaseUrl}`,
        );
      }
    } catch (err) {
      this.logger.warn(
        'Supabase connectivity check failed – service may be unreachable at startup.',
        err,
      );
    }
  }
}
