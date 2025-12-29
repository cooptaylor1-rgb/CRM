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
  Request,
  ParseUUIDPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { PreferencesService } from './preferences.service';
import { RelationshipType } from './entities/client-relationship.entity';
import {
  CreateClientPreferenceDto,
  UpdateClientPreferenceDto,
  CreateClientRelationshipDto,
  UpdateClientRelationshipDto,
} from './dto/preference.dto';

interface RequestWithUser {
  user: { id: string; email: string; role: string };
}

@ApiTags('Client Preferences & Relationships')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('api/preferences')
export class PreferencesController {
  constructor(private readonly preferencesService: PreferencesService) {}

  // Client Preferences
  @Post()
  @ApiOperation({ summary: 'Create client preferences for a household' })
  async createPreference(@Body() dto: CreateClientPreferenceDto, @Request() req: RequestWithUser) {
    return this.preferencesService.createPreference(dto, req.user.id);
  }

  @Get('household/:householdId')
  @ApiOperation({ summary: 'Get preferences for a household' })
  async getPreferenceByHousehold(@Param('householdId', ParseUUIDPipe) householdId: string) {
    return this.preferencesService.getPreferenceByHousehold(householdId);
  }

  @Put('household/:householdId')
  @ApiOperation({ summary: 'Update preferences for a household' })
  async updatePreference(
    @Param('householdId', ParseUUIDPipe) householdId: string,
    @Body() dto: UpdateClientPreferenceDto,
    @Request() req: RequestWithUser,
  ) {
    return this.preferencesService.updatePreference(householdId, dto, req.user.id);
  }

  @Get('important-dates')
  @ApiOperation({ summary: 'Get upcoming important dates across all clients' })
  async getUpcomingImportantDates(@Query('days') days: number = 30) {
    return this.preferencesService.getUpcomingImportantDates(days);
  }

  // Client Relationships
  @Post('relationships')
  @ApiOperation({ summary: 'Create a client relationship' })
  async createRelationship(@Body() dto: CreateClientRelationshipDto, @Request() req: RequestWithUser) {
    return this.preferencesService.createRelationship(dto, req.user.id);
  }

  @Get('relationships/household/:householdId')
  @ApiOperation({ summary: 'Get all relationships for a household' })
  async getRelationshipsByHousehold(@Param('householdId', ParseUUIDPipe) householdId: string) {
    return this.preferencesService.getRelationshipsByHousehold(householdId);
  }

  @Get('relationships/household/:householdId/map')
  @ApiOperation({ summary: 'Get relationship map for a household (categorized)' })
  async getRelationshipMap(@Param('householdId', ParseUUIDPipe) householdId: string) {
    return this.preferencesService.getRelationshipMap(householdId);
  }

  @Get('relationships/by-type/:type')
  @ApiOperation({ summary: 'Get all relationships by type (e.g., all CPAs)' })
  async getRelationshipsByType(@Param('type') type: RelationshipType) {
    return this.preferencesService.getRelationshipsByType(type);
  }

  @Get('relationships/expiring-releases')
  @ApiOperation({ summary: 'Get relationships with expiring release authorizations' })
  async getExpiringReleases(@Query('days') days: number = 30) {
    return this.preferencesService.getExpiringReleases(days);
  }

  @Get('relationships/:id')
  @ApiOperation({ summary: 'Get a specific relationship' })
  async getRelationship(@Param('id', ParseUUIDPipe) id: string) {
    return this.preferencesService.getRelationship(id);
  }

  @Put('relationships/:id')
  @ApiOperation({ summary: 'Update a relationship' })
  async updateRelationship(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateClientRelationshipDto,
  ) {
    return this.preferencesService.updateRelationship(id, dto);
  }

  @Delete('relationships/:id')
  @ApiOperation({ summary: 'Delete a relationship' })
  async deleteRelationship(@Param('id', ParseUUIDPipe) id: string) {
    return this.preferencesService.deleteRelationship(id);
  }
}
