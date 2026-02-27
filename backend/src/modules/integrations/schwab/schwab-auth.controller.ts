/**
 * SchwabAuthController
 *
 * Exposes the Schwab OAuth 2.0 endpoints:
 *  GET  /api/integrations/schwab/auth       — initiates OAuth flow
 *  GET  /api/integrations/schwab/callback   — handles callback from Schwab
 *  POST /api/integrations/schwab/disconnect — revokes stored tokens
 *  GET  /api/integrations/schwab/status     — returns connection status
 */

import {
  Controller,
  Get,
  Post,
  Query,
  Req,
  Res,
  UnauthorizedException,
  BadRequestException,
  InternalServerErrorException,
  HttpCode,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { SchwabAuthService } from './schwab-auth.service';

/**
 * Minimal shape of the session object used for CSRF state storage.
 * The actual session is provided by express-session or @nestjs/passport.
 */
interface SchwabSession {
  schwabOAuthState?: string;
}

@Controller('api/integrations/schwab')
export class SchwabAuthController {
  private readonly logger = new Logger(SchwabAuthController.name);

  constructor(private readonly authService: SchwabAuthService) {}

  // -------------------------------------------------------------------------
  // GET /api/integrations/schwab/auth
  // -------------------------------------------------------------------------

  /**
   * Initiates the Schwab OAuth flow.
   * Generates a CSRF state token, stores it in the session, and returns the
   * Schwab authorization URL for the client to redirect the user to.
   *
   * @returns { authUrl: string }
   */
  @Get('auth')
  initiateOAuth(
    @Req() req: Request & { session: SchwabSession },
  ): { authUrl: string } {
    const state = uuidv4();
    req.session.schwabOAuthState = state;

    const authUrl = this.authService.getAuthorizationUrl(state);
    this.logger.log(`Initiating Schwab OAuth for session (state=${state})`);

    return { authUrl };
  }

  // -------------------------------------------------------------------------
  // GET /api/integrations/schwab/callback
  // -------------------------------------------------------------------------

  /**
   * OAuth callback handler.
   * Validates the CSRF state, exchanges the auth code for tokens, and stores
   * them. Redirects the user to the frontend on success.
   */
  @Get('callback')
  async handleCallback(
    @Query('code') code: string,
    @Query('state') state: string,
    @Req() req: Request & { session: SchwabSession; user?: { id: string } },
    @Res() res: Response,
  ): Promise<void> {
    if (!code) {
      throw new BadRequestException('Missing authorization code in callback');
    }

    // CSRF state validation
    const savedState = req.session.schwabOAuthState;
    if (!savedState || savedState !== state) {
      this.logger.warn(
        `OAuth state mismatch: expected=${savedState} received=${state}`,
      );
      throw new UnauthorizedException(
        'Invalid OAuth state. Please restart the connection flow.',
      );
    }

    // Clear state from session
    delete req.session.schwabOAuthState;

    const userId = req.user?.id;
    if (!userId) {
      throw new UnauthorizedException('User must be authenticated to connect Schwab');
    }

    try {
      const tokens = await this.authService.exchangeCodeForTokens(code);
      await this.authService.storeTokens(userId, tokens);
      this.logger.log(`Schwab OAuth completed for user ${userId}`);
    } catch (err) {
      this.logger.error(`Schwab OAuth callback error for user ${userId}`, err);
      res.redirect('/settings/integrations?schwab=error');
      return;
    }

    res.redirect('/settings/integrations?schwab=connected');
  }

  // -------------------------------------------------------------------------
  // POST /api/integrations/schwab/disconnect
  // -------------------------------------------------------------------------

  /**
   * Revokes the stored Schwab tokens for the authenticated user,
   * removing the integration connection.
   */
  @Post('disconnect')
  @HttpCode(HttpStatus.OK)
  async disconnect(
    @Req() req: Request & { user?: { id: string } },
  ): Promise<{ success: boolean; message: string }> {
    const userId = req.user?.id;
    if (!userId) {
      throw new UnauthorizedException('Not authenticated');
    }

    await this.authService.revokeTokens(userId);
    this.logger.log(`Schwab disconnected for user ${userId}`);

    return { success: true, message: 'Schwab account disconnected successfully' };
  }

  // -------------------------------------------------------------------------
  // GET /api/integrations/schwab/status
  // -------------------------------------------------------------------------

  /**
   * Returns the current Schwab connection status for the authenticated user.
   *
   * @returns { connected: boolean }
   */
  @Get('status')
  async getStatus(
    @Req() req: Request & { user?: { id: string } },
  ): Promise<{ connected: boolean }> {
    const userId = req.user?.id;
    if (!userId) {
      throw new UnauthorizedException('Not authenticated');
    }

    const connected = await this.authService.isConnected(userId);
    return { connected };
  }
}
