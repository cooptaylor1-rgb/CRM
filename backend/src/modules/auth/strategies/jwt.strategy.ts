import { Injectable, UnauthorizedException, Logger } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../entities/user.entity';
import * as crypto from 'crypto';

// Generate secret outside the class to use before super()
function getJwtSecret(configService: ConfigService): string {
  const jwtSecret = configService.get<string>('JWT_SECRET');
  const nodeEnv = configService.get<string>('NODE_ENV');

  // Fail fast in production if no secret
  if (nodeEnv === 'production' && !jwtSecret) {
    throw new Error('CRITICAL: JWT_SECRET must be set in production environment');
  }

  // Use provided secret or generate random dev secret (prevents predictable tokens in dev)
  return jwtSecret || 'dev-jwt-' + crypto.randomBytes(16).toString('hex');
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  private readonly logger = new Logger(JwtStrategy.name);

  constructor(
    private readonly configService: ConfigService,
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {
    const secret = getJwtSecret(configService);
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: secret,
    });
    
    if (!configService.get('JWT_SECRET')) {
      this.logger.warn('JWT_SECRET not set - using auto-generated development secret. Tokens will invalidate on restart.');
    }
  }

  async validate(payload: any) {
    const user = await this.userRepository.findOne({
      where: { id: payload.sub },
      relations: ['roles'],
    });

    if (!user || !user.isActive) {
      throw new UnauthorizedException('User not found or inactive');
    }

    return {
      id: user.id,
      email: user.email,
      roles: user.roleNames,
    };
  }
}
