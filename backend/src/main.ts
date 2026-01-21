import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';

async function bootstrap() {
  const logger = new Logger('Bootstrap');

  logger.log('Starting CRM Backend...');
  logger.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
  logger.log(`Database URL configured: ${process.env.DATABASE_URL ? 'Yes' : 'No'}`);

  const app = await NestFactory.create(AppModule);

  // Security middleware - configured for financial services compliance
  app.use(
    helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          scriptSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          imgSrc: ["'self'", 'data:', 'https:'],
          connectSrc: ["'self'"],
          fontSrc: ["'self'"],
          objectSrc: ["'none'"],
          frameAncestors: ["'none'"],
        },
      },
      hsts: {
        maxAge: 31536000, // 1 year
        includeSubDomains: true,
        preload: true,
      },
      noSniff: true,
      frameguard: { action: 'deny' },
      xssFilter: true,
      referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
    }),
  );

  // Global rate limiting - general API protection
  app.use(
    rateLimit({
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: 1000, // 1000 requests per window
      message: { statusCode: 429, message: 'Too many requests, please try again later' },
      standardHeaders: true,
      legacyHeaders: false,
    }),
  );

  // Stricter rate limiting for auth endpoints (brute force protection)
  app.use(
    '/api/auth',
    rateLimit({
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: 10, // 10 login attempts per 15 minutes
      message: { statusCode: 429, message: 'Too many authentication attempts, please try again later' },
      standardHeaders: true,
      legacyHeaders: false,
      skipSuccessfulRequests: true, // Don't count successful logins
    }),
  );

  // Enable CORS for frontend
  const allowedOrigins = process.env.FRONTEND_URL 
    ? [process.env.FRONTEND_URL, 'http://localhost:3000']
    : ['http://localhost:3000'];
  
  app.enableCors({
    origin: (origin, callback) => {
      // Allow requests with no origin (mobile apps, curl, etc) only in development
      if (!origin) {
        const isDev = process.env.NODE_ENV !== 'production';
        return callback(isDev ? null : new Error('Origin required'), isDev);
      }

      // Check if origin matches allowed origins or Railway/GitHub patterns
      const isAllowed = allowedOrigins.some(allowed => origin === allowed) ||
        /\.up\.railway\.app$/.test(origin) ||
        /\.railway\.app$/.test(origin) ||
        /\.app\.github\.dev$/.test(origin);

      if (isAllowed) {
        callback(null, true);
      } else {
        logger.warn(`CORS: Blocked request from origin: ${origin}`);
        callback(new Error('Not allowed by CORS'), false);
      }
    },
    credentials: true,
  });

  // Global exception filter - ensures consistent error responses
  app.useGlobalFilters(new HttpExceptionFilter());

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  // API prefix
  app.setGlobalPrefix('api');

  // Swagger API documentation (disabled in production unless explicitly enabled)
  const isProduction = process.env.NODE_ENV === 'production';
  const enableSwaggerInProd = process.env.ENABLE_SWAGGER_IN_PRODUCTION === 'true';

  if (!isProduction || enableSwaggerInProd) {
    const config = new DocumentBuilder()
      .setTitle('Wealth Management CRM API')
      .setDescription('SEC-compliant wealth management CRM REST API')
      .setVersion('1.0')
      .addBearerAuth()
      .addTag('auth', 'Authentication endpoints')
      .addTag('households', 'Household management')
      .addTag('accounts', 'Account management')
      .addTag('persons', 'Person management')
      .addTag('entities', 'Legal entity management')
      .addTag('compliance', 'Compliance and reviews')
      .addTag('audit', 'Audit log')
      .addTag('documents', 'Document management')
      .build();

    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('api/docs', app, document);
    logger.log('Swagger documentation enabled at /api/docs');
  } else {
    logger.log('Swagger documentation disabled in production');
  }

  // Enable graceful shutdown
  app.enableShutdownHooks();

  const port = process.env.PORT || 3001;
  await app.listen(port, '0.0.0.0');

  logger.log(`Application is running on: http://localhost:${port}`);
  if (!isProduction || enableSwaggerInProd) {
    logger.log(`API Documentation: http://localhost:${port}/api/docs`);
  }

  // Graceful shutdown handlers
  const shutdown = async (signal: string) => {
    logger.log(`Received ${signal}, starting graceful shutdown...`);
    await app.close();
    logger.log('Application shut down gracefully');
    process.exit(0);
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
}

bootstrap();
