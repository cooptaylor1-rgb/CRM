import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
  ParseUUIDPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { SecurityService } from './security.service';
import { IncidentStatus } from './entities/security-incident.entity';
import {
  CreateSecurityIncidentDto,
  UpdateSecurityIncidentDto,
  AddTimelineEntryDto,
  CreateKycVerificationDto,
  UpdateKycVerificationDto,
  CreateSarDto,
} from './dto/security.dto';

interface RequestWithUser {
  user: { id: string; email: string; role: string };
}

@ApiTags('Security & Compliance')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('api/security')
export class SecurityController {
  constructor(private readonly securityService: SecurityService) {}

  // ==================== Security Incidents ====================

  @Post('incidents')
  @ApiOperation({ summary: 'Create a security incident' })
  @Roles('admin', 'compliance_officer')
  async createIncident(@Body() dto: CreateSecurityIncidentDto, @Request() req: RequestWithUser) {
    return this.securityService.createIncident(dto, req.user.id);
  }

  @Get('incidents')
  @ApiOperation({ summary: 'Get all security incidents' })
  @Roles('admin', 'compliance_officer')
  async getAllIncidents(@Query('status') status?: IncidentStatus) {
    return this.securityService.getAllIncidents(status);
  }

  @Get('incidents/stats')
  @ApiOperation({ summary: 'Get incident statistics' })
  @Roles('admin', 'compliance_officer')
  async getIncidentStats() {
    return this.securityService.getIncidentStats();
  }

  @Get('incidents/:id')
  @ApiOperation({ summary: 'Get a specific incident' })
  @Roles('admin', 'compliance_officer')
  async getIncident(@Param('id', ParseUUIDPipe) id: string) {
    return this.securityService.getIncident(id);
  }

  @Put('incidents/:id')
  @ApiOperation({ summary: 'Update an incident' })
  @Roles('admin', 'compliance_officer')
  async updateIncident(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateSecurityIncidentDto,
    @Request() req: RequestWithUser,
  ) {
    return this.securityService.updateIncident(id, dto, req.user.id);
  }

  @Post('incidents/:id/timeline')
  @ApiOperation({ summary: 'Add a timeline entry to an incident' })
  @Roles('admin', 'compliance_officer')
  async addTimelineEntry(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: AddTimelineEntryDto,
    @Request() req: RequestWithUser,
  ) {
    return this.securityService.addTimelineEntry(id, dto, req.user.id);
  }

  // ==================== KYC Verification ====================

  @Post('kyc')
  @ApiOperation({ summary: 'Create KYC verification for a person' })
  async createKycVerification(@Body() dto: CreateKycVerificationDto, @Request() req: RequestWithUser) {
    return this.securityService.createKycVerification(dto, req.user.id);
  }

  @Get('kyc/person/:personId')
  @ApiOperation({ summary: 'Get KYC verification for a person' })
  async getKycByPerson(@Param('personId', ParseUUIDPipe) personId: string) {
    return this.securityService.getKycByPerson(personId);
  }

  @Put('kyc/:id')
  @ApiOperation({ summary: 'Update KYC verification' })
  async updateKycVerification(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateKycVerificationDto,
    @Request() req: RequestWithUser,
  ) {
    return this.securityService.updateKycVerification(id, dto, req.user.id);
  }

  @Post('kyc/:personId/sanctions-screening')
  @ApiOperation({ summary: 'Run sanctions screening for a person' })
  @Roles('admin', 'compliance_officer')
  async runSanctionsScreening(
    @Param('personId', ParseUUIDPipe) personId: string,
    @Request() req: RequestWithUser,
  ) {
    return this.securityService.runSanctionsScreening(personId, req.user.id);
  }

  @Post('kyc/:personId/pep-screening')
  @ApiOperation({ summary: 'Run PEP screening for a person' })
  @Roles('admin', 'compliance_officer')
  async runPepScreening(
    @Param('personId', ParseUUIDPipe) personId: string,
    @Request() req: RequestWithUser,
  ) {
    return this.securityService.runPepScreening(personId, req.user.id);
  }

  @Get('kyc/due-for-review')
  @ApiOperation({ summary: 'Get KYC verifications due for periodic review' })
  async getKycDueForReview() {
    return this.securityService.getKycDueForReview();
  }

  @Get('kyc/high-risk')
  @ApiOperation({ summary: 'Get high-risk clients' })
  @Roles('admin', 'compliance_officer')
  async getHighRiskClients() {
    return this.securityService.getHighRiskClients();
  }

  @Get('kyc/stats')
  @ApiOperation({ summary: 'Get KYC statistics' })
  async getKycStats() {
    return this.securityService.getKycStats();
  }

  // ==================== Suspicious Activity Reports ====================

  @Post('sar')
  @ApiOperation({ summary: 'Create a Suspicious Activity Report' })
  @Roles('admin', 'compliance_officer')
  async createSar(@Body() dto: CreateSarDto, @Request() req: RequestWithUser) {
    return this.securityService.createSar(dto, req.user.id);
  }

  @Get('sar')
  @ApiOperation({ summary: 'Get all SARs' })
  @Roles('admin', 'compliance_officer')
  async getAllSars() {
    return this.securityService.getAllSars();
  }

  @Get('sar/:id')
  @ApiOperation({ summary: 'Get a specific SAR' })
  @Roles('admin', 'compliance_officer')
  async getSar(@Param('id', ParseUUIDPipe) id: string) {
    return this.securityService.getSar(id);
  }

  @Put('sar/:id')
  @ApiOperation({ summary: 'Update a SAR' })
  @Roles('admin', 'compliance_officer')
  async updateSar(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updates: any,
  ) {
    return this.securityService.updateSar(id, updates);
  }
}
