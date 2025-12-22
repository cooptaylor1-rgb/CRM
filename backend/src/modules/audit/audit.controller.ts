import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { AuditService } from './audit.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';

@ApiTags('audit')
@Controller('audit')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class AuditController {
  constructor(private readonly auditService: AuditService) {}

  @Get()
  @Roles('admin', 'compliance_officer')
  @ApiOperation({ summary: 'Get audit events' })
  @ApiQuery({ name: 'limit', required: false })
  findAll(@Query('limit') limit?: number) {
    return this.auditService.findAll(limit);
  }

  @Get('user')
  @Roles('admin', 'compliance_officer')
  @ApiOperation({ summary: 'Get audit events by user' })
  @ApiQuery({ name: 'userId', required: true })
  findByUser(@Query('userId') userId: string) {
    return this.auditService.findByUser(userId);
  }

  @Get('entity')
  @Roles('admin', 'compliance_officer')
  @ApiOperation({ summary: 'Get audit events by entity' })
  @ApiQuery({ name: 'entityType', required: true })
  @ApiQuery({ name: 'entityId', required: true })
  findByEntity(
    @Query('entityType') entityType: string,
    @Query('entityId') entityId: string,
  ) {
    return this.auditService.findByEntity(entityType, entityId);
  }
}
