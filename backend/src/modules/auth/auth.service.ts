import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { User } from './entities/user.entity';
import { Role } from './entities/role.entity';
import { LoginDto } from './dto/login.dto';
import { AuthResponseDto } from './dto/auth-response.dto';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(Role)
    private roleRepository: Repository<Role>,
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {}

  async login(loginDto: LoginDto): Promise<AuthResponseDto> {
    console.log(`🔑 Login attempt for: ${loginDto.email}`);
    
    const user = await this.userRepository.findOne({
      where: { email: loginDto.email },
      relations: ['roles'],
    });

    if (!user) {
      console.log(`🔑 User not found: ${loginDto.email}`);
      throw new UnauthorizedException('Invalid credentials');
    }
    
    if (!user.isActive) {
      console.log(`🔑 User inactive: ${loginDto.email}`);
      throw new UnauthorizedException('Invalid credentials');
    }

    console.log(`🔑 User found, validating password...`);
    const isPasswordValid = await user.validatePassword(loginDto.password);
    console.log(`🔑 Password valid: ${isPasswordValid}`);
    
    if (!isPasswordValid) {
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
        secret: this.configService.get('REFRESH_TOKEN_SECRET') || 'dev-refresh-secret-change-in-production',
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
      secret: this.configService.get('JWT_SECRET') || 'dev-jwt-secret-change-in-production',
      expiresIn: this.configService.get('JWT_EXPIRES_IN') || '15m',
    });

    const refreshToken = this.jwtService.sign(payload, {
      secret: this.configService.get('REFRESH_TOKEN_SECRET') || 'dev-refresh-secret-change-in-production',
      expiresIn: this.configService.get('REFRESH_TOKEN_EXPIRES_IN') || '7d',
    });

    return { accessToken, refreshToken };
  }

  async ensureDefaultUsers() {
    console.log('🔐 Starting ensureDefaultUsers...');
    
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
        console.log(`🔐 Created role: ${roleName}`);
      }
      roles.push(role);
    }

    // Delete existing admin user and recreate to ensure clean state
    // Use raw query to bypass any ORM issues and ensure clean deletion
    try {
      await this.userRepository.query(
        `DELETE FROM user_roles WHERE user_id IN (SELECT id FROM users WHERE email = $1)`,
        ['admin@example.com']
      );
      const deleteResult = await this.userRepository.delete({ email: 'admin@example.com' });
      if (deleteResult.affected && deleteResult.affected > 0) {
        console.log('🔐 Removed existing admin user');
      }
    } catch (err) {
      console.log('🔐 Note: Could not delete existing admin (may not exist):', (err as Error).message);
    }

    // Create admin user with fresh password (matches README)
    const adminRole = roles.find((r) => r.name === 'admin');
    if (adminRole) {
      const newAdmin = this.userRepository.create({
        email: 'admin@example.com',
        password: 'Admin123!',
        firstName: 'System',
        lastName: 'Administrator',
        isActive: true,
        roles: [adminRole],
      });

      const savedAdmin = await this.userRepository.save(newAdmin);
      console.log(`🔐 Created admin user: ${savedAdmin.email}`);
      console.log(`🔐 Admin password hash: ${savedAdmin.password?.substring(0, 20)}...`);
      console.log(`🔐 Admin password hash length: ${savedAdmin.password?.length}`);
      
      // Verify the password works immediately
      const testUser = await this.userRepository.findOne({
        where: { email: 'admin@example.com' },
      });
      if (testUser) {
        console.log(`🔐 Loaded admin password hash: ${testUser.password?.substring(0, 20)}...`);
        const isValid = await testUser.validatePassword('Admin123!');
        console.log(`🔐 Password validation test: ${isValid ? 'PASSED ✅' : 'FAILED ❌'}`);
        if (!isValid) {
          console.log(`🔐 DEBUG: Stored hash doesn't match 'Admin123!'`);
        }
      }
    }
    
    console.log('🔐 ensureDefaultUsers completed');
  }
}
