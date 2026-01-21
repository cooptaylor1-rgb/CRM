import { Controller, Get } from '@nestjs/common';

@Controller('health')
export class HealthController {
  private readonly startTime = new Date();

  @Get()
  check() {
    return {
      status: 'healthy',
      service: 'wealth-crm-api',
      version: process.env.npm_package_version || '1.0.0',
      timestamp: new Date().toISOString(),
      uptime: Math.floor(process.uptime()),
      startedAt: this.startTime.toISOString(),
    };
  }

  @Get('ready')
  ready() {
    // Readiness check - indicates if service can accept traffic
    return {
      status: 'ready',
      timestamp: new Date().toISOString(),
    };
  }

  @Get('live')
  live() {
    // Liveness check - indicates if service is running
    return {
      status: 'alive',
      timestamp: new Date().toISOString(),
    };
  }
}
