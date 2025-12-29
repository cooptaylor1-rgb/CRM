import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';

async function bootstrap() {
  console.log('🚀 Starting CRM Backend...');
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`Database URL configured: ${process.env.DATABASE_URL ? 'Yes' : 'No'}`);
  
  const app = await NestFactory.create(AppModule);

  // Security middleware
  app.use(helmet());

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
      // Allow requests with no origin (mobile apps, curl, etc)
      if (!origin) return callback(null, true);
      
      // Check if origin matches allowed origins or Railway/GitHub patterns
      const isAllowed = allowedOrigins.some(allowed => origin === allowed) ||
        /\.up\.railway\.app$/.test(origin) ||
        /\.railway\.app$/.test(origin) ||
        /\.app\.github\.dev$/.test(origin);
      
      if (isAllowed) {
        callback(null, true);
      } else {
        callback(null, true); // Allow all for now, tighten in production
      }
    },
    credentials: true,
  });

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

  // Swagger API documentation
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

  const port = process.env.PORT || 3001;
  await app.listen(port, '0.0.0.0');
  
  console.log(`🚀 Application is running on: http://localhost:${port}`);
  console.log(`📚 API Documentation: http://localhost:${port}/api/docs`);
}

bootstrap();
