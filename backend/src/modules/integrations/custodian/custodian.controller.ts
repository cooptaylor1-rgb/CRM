import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Res,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { Response } from 'express';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { Roles } from '../../../common/decorators/roles.decorator';
import { CustodianService } from './custodian.service';
import {
  CreateCustodianConnectionDto,
  UpdateCustodianConnectionDto,
  LinkAccountDto,
  SyncRequestDto,
} from './custodian.dto';
import { CustodianType } from './custodian.entity';

@ApiTags('Custodian Integrations')
@ApiBearerAuth()
@Controller('custodian')
@UseGuards(JwtAuthGuard, RolesGuard)
export class CustodianController {
  constructor(private readonly custodianService: CustodianService) {}

  // ==================== Connections ====================

  @Post('connections')
  @Roles('admin')
  @ApiOperation({ summary: 'Create a new custodian connection' })
  async createConnection(@Body() dto: CreateCustodianConnectionDto) {
    return this.custodianService.createConnection(dto);
  }

  @Get('connections')
  @ApiOperation({ summary: 'Get all custodian connections' })
  async getAllConnections() {
    return this.custodianService.getAllConnections();
  }

  @Get('connections/:custodianType')
  @ApiOperation({ summary: 'Get a specific custodian connection' })
  async getConnection(@Param('custodianType') custodianType: CustodianType) {
    return this.custodianService.getConnection(custodianType);
  }

  @Put('connections/:custodianType')
  @Roles('admin')
  @ApiOperation({ summary: 'Update a custodian connection' })
  async updateConnection(
    @Param('custodianType') custodianType: CustodianType,
    @Body() dto: UpdateCustodianConnectionDto,
  ) {
    return this.custodianService.updateConnection(custodianType, dto);
  }

  @Delete('connections/:custodianType')
  @Roles('admin')
  @ApiOperation({ summary: 'Delete a custodian connection' })
  async deleteConnection(@Param('custodianType') custodianType: CustodianType) {
    return this.custodianService.deleteConnection(custodianType);
  }

  // ==================== OAuth ====================

  @Get('oauth/:custodianType/authorize')
  @ApiOperation({ summary: 'Get OAuth authorization URL' })
  async getOAuthUrl(@Param('custodianType') custodianType: CustodianType) {
    const url = this.custodianService.getOAuthUrl(custodianType);
    return { url };
  }

  @Get('oauth/:custodianType/callback')
  @ApiOperation({ summary: 'OAuth callback handler' })
  async handleOAuthCallback(
    @Param('custodianType') custodianType: CustodianType,
    @Query('code') code: string,
    @Query('state') state: string,
    @Res() res: Response,
  ) {
    await this.custodianService.handleOAuthCallback(custodianType, code, state);
    // Redirect to frontend integrations page
    res.redirect('/integrations?connected=' + custodianType);
  }

  @Post('oauth/:custodianType/disconnect')
  @ApiOperation({ summary: 'Disconnect from custodian' })
  async disconnect(@Param('custodianType') custodianType: CustodianType) {
    return this.custodianService.disconnect(custodianType);
  }

  // ==================== Account Linking ====================

  @Post('accounts/link')
  @ApiOperation({ summary: 'Link a CRM account to a custodian account' })
  async linkAccount(@Body() dto: LinkAccountDto) {
    return this.custodianService.linkAccount(dto);
  }

  @Delete('accounts/:accountId/link')
  @ApiOperation({ summary: 'Unlink a CRM account from custodian' })
  async unlinkAccount(@Param('accountId') accountId: string) {
    return this.custodianService.unlinkAccount(accountId);
  }

  @Get('accounts/linked')
  @ApiOperation({ summary: 'Get all linked accounts' })
  async getLinkedAccounts(@Query('custodianType') custodianType?: CustodianType) {
    return this.custodianService.getLinkedAccounts(custodianType);
  }

  @Get('accounts/:accountId/link')
  @ApiOperation({ summary: 'Get link status for an account' })
  async getAccountLink(@Param('accountId') accountId: string) {
    return this.custodianService.getAccountLink(accountId);
  }

  // ==================== Discovery ====================

  @Get('discover/:custodianType')
  @ApiOperation({ summary: 'Discover accounts from custodian' })
  async discoverAccounts(@Param('custodianType') custodianType: CustodianType) {
    return this.custodianService.discoverAccounts(custodianType);
  }

  // ==================== Syncing ====================

  @Post('sync/accounts')
  @ApiOperation({ summary: 'Sync accounts from custodian' })
  async syncAccounts(@Body() dto: SyncRequestDto) {
    return this.custodianService.syncAccounts(dto.custodianType);
  }

  @Post('sync/positions')
  @ApiOperation({ summary: 'Sync positions from custodian' })
  async syncPositions(@Body() dto: SyncRequestDto) {
    return this.custodianService.syncPositions(dto.custodianType, dto.accountLinkId);
  }

  @Post('sync/full')
  @ApiOperation({ summary: 'Full sync from custodian' })
  async fullSync(@Body() dto: SyncRequestDto) {
    return this.custodianService.fullSync(dto.custodianType);
  }

  // ==================== Status & Logs ====================

  @Get('status/:custodianType')
  @ApiOperation({ summary: 'Get connection status' })
  async getStatus(@Param('custodianType') custodianType: CustodianType) {
    return this.custodianService.getConnectionStatus(custodianType);
  }

  @Get('sync-logs')
  @ApiOperation({ summary: 'Get sync logs' })
  async getSyncLogs(
    @Query('custodianType') custodianType?: CustodianType,
    @Query('limit') limit?: number,
  ) {
    return this.custodianService.getSyncLogs(custodianType, limit);
  }

  @Get('sync-logs/:id')
  @ApiOperation({ summary: 'Get a specific sync log' })
  async getSyncLog(@Param('id') id: string) {
    return this.custodianService.getSyncLog(id);
  }
}
