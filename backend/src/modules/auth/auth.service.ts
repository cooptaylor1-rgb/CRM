import { Injectable, UnauthorizedException, OnModuleInit, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { User } from './entities/user.entity';
import { Role } from './entities/role.entity';
import { LoginDto } from './dto/login.dto';
import { AuthResponseDto } from './dto/auth-response.dto';

@Injectable()
export class AuthService implements OnModuleInit {
  private readonly logger = new Logger(AuthService.name);
  private readonly jwtSecret: string;
  private readonly refreshSecret: string;

  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(Role)
    private roleRepository: Repository<Role>,
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {
    // Validate required secrets on startup
    const jwtSecret = this.configService.get<string>('JWT_SECRET');
    const refreshSecret = this.configService.get<string>('REFRESH_TOKEN_SECRET');
    const nodeEnv = this.configService.get<string>('NODE_ENV');

    if (nodeEnv === 'production') {
      if (!jwtSecret) {
        throw new Error('CRITICAL: JWT_SECRET must be set in production environment');
      }
      if (!refreshSecret) {
        throw new Error('CRITICAL: REFRESH_TOKEN_SECRET must be set in production environment');
      }
    }

    // Use provided secrets or dev fallbacks (only for non-production)
    this.jwtSecret = jwtSecret || 'dev-jwt-secret-' + require('crypto').randomBytes(16).toString('hex');
    this.refreshSecret = refreshSecret || 'dev-refresh-secret-' + require('crypto').randomBytes(16).toString('hex');

    if (!jwtSecret || !refreshSecret) {
      this.logger.warn('Using auto-generated development secrets. Set JWT_SECRET and REFRESH_TOKEN_SECRET for production.');
    }
  }

  onModuleInit() {
    this.logger.log('AuthService initialized with secure configuration');
  }

  async login(loginDto: LoginDto): Promise<AuthResponseDto> {
    // Log only non-sensitive info for audit purposes
    this.logger.log(`Login attempt from IP context`);

    const user = await this.userRepository.findOne({
      where: { email: loginDto.email },
      relations: ['roles'],
    });

    if (!user) {
      // Don't log the email to prevent enumeration info leaks
      this.logger.warn('Login failed: user not found');
      throw new UnauthorizedException('Invalid credentials');
    }

    if (!user.isActive) {
      this.logger.warn(`Login failed: inactive account for user ${user.id}`);
      throw new UnauthorizedException('Invalid credentials');
    }

    const isPasswordValid = await user.validatePassword(loginDto.password);

    if (!isPasswordValid) {
      this.logger.warn(`Login failed: invalid password for user ${user.id}`);
      throw new UnauthorizedException('Invalid credentials');
    }

    // Update last login using query builder to avoid triggering entity hooks
    await this.userRepository.update(
      { id: user.id },
      { lastLogin: new Date() }
    );

    const tokens = await this.generateTokens(user);

    return {
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        roles: user.roleNames,
      },
    };
  }

  async refreshToken(refreshToken: string): Promise<AuthResponseDto> {
    try {
      const payload = this.jwtService.verify(refreshToken, {
        secret: this.refreshSecret,
      });

      const user = await this.userRepository.findOne({
        where: { id: payload.sub },
        relations: ['roles'],
      });

      if (!user || !user.isActive) {
        throw new UnauthorizedException('Invalid refresh token');
      }

      const tokens = await this.generateTokens(user);

      return {
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          roles: user.roleNames,
        },
      };
    } catch (error) {
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  async getCurrentUser(userId: string) {
    const user = await this.userRepository.findOne({
      where: { id: userId },
      relations: ['roles'],
    });

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    return {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      roles: user.roleNames,
    };
  }

  private async generateTokens(user: User) {
    const payload = { email: user.email, sub: user.id, roles: user.roleNames };

    const accessToken = this.jwtService.sign(payload, {
      secret: this.jwtSecret,
      expiresIn: this.configService.get('JWT_EXPIRES_IN') || '15m',
    });

    const refreshToken = this.jwtService.sign(payload, {
      secret: this.refreshSecret,
      expiresIn: this.configService.get('REFRESH_TOKEN_EXPIRES_IN') || '7d',
    });

    return { accessToken, refreshToken };
  }

  async ensureDefaultUsers() {
    this.logger.log('Initializing default users and roles...');

    // Create roles if they don't exist
    const roleNames = [
      'admin',
      'compliance_officer',
      'advisor',
      'operations',
      'read_only',
    ];

    const roles = [];
    for (const roleName of roleNames) {
      let role = await this.roleRepository.findOne({
        where: { name: roleName },
      });

      if (!role) {
        role = this.roleRepository.create({
          name: roleName,
          description: `${roleName} role`,
        });
        role = await this.roleRepository.save(role);
        this.logger.log(`Created role: ${roleName}`);
      }
      roles.push(role);
    }

    // Get admin configuration from environment
    const adminEmail = this.configService.get<string>('DEFAULT_ADMIN_EMAIL') || 'admin@example.com';
    const adminPassword = this.configService.get<string>('DEFAULT_ADMIN_PASSWORD');
    const nodeEnv = this.configService.get<string>('NODE_ENV');

    // In production, require explicit admin password
    if (nodeEnv === 'production' && !adminPassword) {
      this.logger.warn('Skipping default admin creation in production - set DEFAULT_ADMIN_PASSWORD to create admin user');
      return;
    }

    // Use env password or secure default for development only
    const password = adminPassword || 'Admin123!';

    // Delete existing admin user and recreate to ensure clean state
    try {
      await this.userRepository.query(
        `DELETE FROM user_roles WHERE user_id IN (SELECT id FROM users WHERE email = $1)`,
        [adminEmail]
      );
      const deleteResult = await this.userRepository.delete({ email: adminEmail });
      if (deleteResult.affected && deleteResult.affected > 0) {
        this.logger.log('Removed existing admin user for recreation');
      }
    } catch (err) {
      // Admin may not exist, which is fine
      this.logger.debug(`Admin cleanup: ${(err as Error).message}`);
    }

    // Create admin user
    const adminRole = roles.find((r) => r.name === 'admin');
    if (adminRole) {
      const newAdmin = this.userRepository.create({
        email: adminEmail,
        password: password,
        firstName: 'System',
        lastName: 'Administrator',
        isActive: true,
        roles: [adminRole],
      });

      await this.userRepository.save(newAdmin);
      this.logger.log(`Admin user initialized: ${adminEmail}`);

      // Verify password works (development only)
      if (nodeEnv !== 'production') {
        const testUser = await this.userRepository.findOne({
          where: { email: adminEmail },
        });
        if (testUser) {
          const isValid = await testUser.validatePassword(password);
          if (!isValid) {
            this.logger.error('Admin password validation failed - check User entity password hashing');
          }
        }
      }
    }

    this.logger.log('Default users initialization completed');
  }
}
