import { Global, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import supabaseConfig from '../../config/supabase.config';
import { SupabaseService } from './supabase.service';

/**
 * Global NestJS module that bootstraps the Supabase integration.
 *
 * Marked @Global() so SupabaseService is available throughout the application
 * without needing to re-import this module in every feature module.
 *
 * Import this module once in AppModule.
 */
@Global()
@Module({
  imports: [
    ConfigModule.forFeature(supabaseConfig),
  ],
  providers: [SupabaseService],
  exports: [SupabaseService],
})
export class SupabaseModule {}
