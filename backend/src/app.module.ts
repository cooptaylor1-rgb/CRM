import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from './modules/auth/auth.module';
import { HouseholdsModule } from './modules/households/households.module';
import { AccountsModule } from './modules/accounts/accounts.module';
import { PersonsModule } from './modules/persons/persons.module';
import { EntitiesModule } from './modules/entities/entities.module';
import { AuditModule } from './modules/audit/audit.module';
import { ComplianceModule } from './modules/compliance/compliance.module';
import { DocumentsModule } from './modules/documents/documents.module';
import { HealthController } from './health.controller';
import { EncryptionModule } from './common/services/encryption.module';

// Import all entities explicitly for production builds
import { User } from './modules/auth/entities/user.entity';
import { Role } from './modules/auth/entities/role.entity';
import { Household } from './modules/households/entities/household.entity';
import { Account } from './modules/accounts/entities/account.entity';
import { Position } from './modules/accounts/entities/position.entity';
import { Person } from './modules/persons/entities/person.entity';
import { LegalEntity } from './modules/entities/entities/entity.entity';
import { AuditEvent } from './modules/audit/entities/audit-event.entity';
import { ComplianceReview } from './modules/compliance/entities/compliance-review.entity';
import { Document } from './modules/documents/entities/document.entity';

const entities = [
  User,
  Role,
  Household,
  Account,
  Position,
  Person,
  LegalEntity,
  AuditEvent,
  ComplianceReview,
  Document,
];

@Module({
  imports: [
    // Global configuration
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),

    // Database connection
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const databaseUrl = configService.get('DATABASE_URL');
        
        // If DATABASE_URL is provided (Railway), use it directly
        if (databaseUrl) {
          return {
            type: 'postgres',
            url: databaseUrl,
            entities: entities,
            synchronize: true, // Auto-create tables
            logging: false,
            ssl: { rejectUnauthorized: false },
          };
        }
        
        // Otherwise use individual environment variables
        return {
          type: 'postgres',
          host: configService.get('DB_HOST'),
          port: configService.get('DB_PORT'),
          username: configService.get('DB_USER'),
          password: configService.get('DB_PASSWORD'),
          database: configService.get('DB_NAME'),
          entities: entities,
          synchronize: true, // Auto-sync in development
          logging: configService.get('NODE_ENV') === 'development',
          ssl: configService.get('DB_SSL') === 'true' ? { rejectUnauthorized: false } : false,
        };
      },
    }),

    // Feature modules
    EncryptionModule,
    AuthModule,
    HouseholdsModule,
    AccountsModule,
    PersonsModule,
    EntitiesModule,
    AuditModule,
    ComplianceModule,
    DocumentsModule,
  ],
  controllers: [HealthController],
})
export class AppModule {}
