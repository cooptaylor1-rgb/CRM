import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse } from '@nestjs/swagger';
import { DocumentsService } from './documents.service';
import { CreateDocumentDto } from './dto/create-document.dto';
import { UpdateDocumentDto } from './dto/update-document.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('documents')
@Controller('documents')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class DocumentsController {
  constructor(private readonly documentsService: DocumentsService) {}

  @Post()
  @Roles('admin', 'advisor', 'operations', 'compliance_officer')
  @ApiOperation({ summary: 'Create a document record (immutable once created)' })
  @ApiResponse({ status: 201, description: 'Document created successfully' })
  create(
    @Body() createDocumentDto: CreateDocumentDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.documentsService.create(createDocumentDto, userId);
  }

  @Get()
  @ApiOperation({ summary: 'Get all active documents' })
  findAll() {
    return this.documentsService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a document by ID' })
  findOne(@Param('id') id: string) {
    return this.documentsService.findOne(id);
  }

  @Get(':id/history')
  @ApiOperation({ summary: 'Get document version history (audit trail)' })
  @ApiResponse({ status: 200, description: 'Document version history retrieved' })
  getVersionHistory(@Param('id') id: string) {
    return this.documentsService.getVersionHistory(id);
  }

  @Post(':id/amend')
  @Roles('admin', 'advisor', 'compliance_officer')
  @ApiOperation({ summary: 'Create document amendment (WORM compliant)' })
  @ApiResponse({ status: 201, description: 'Amendment created, original preserved' })
  createAmendment(
    @Param('id') id: string,
    @Body() body: { document: CreateDocumentDto; supersessionReason: string },
    @CurrentUser('id') userId: string,
  ) {
    return this.documentsService.createAmendment(
      id,
      body.document,
      body.supersessionReason,
      userId,
    );
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a document (FORBIDDEN - SEC 204-2)' })
  @ApiResponse({ status: 403, description: 'Documents are immutable per SEC Rule 204-2' })
  update(@Param('id') id: string, @Body() updateDocumentDto: UpdateDocumentDto) {
    return this.documentsService.update(id, updateDocumentDto);
  }

  @Delete(':id')
  @Roles('admin', 'compliance_officer')
  @ApiOperation({ summary: 'Soft delete document (requires reason for SEC compliance)' })
  @ApiResponse({ status: 200, description: 'Document soft deleted with audit trail' })
  remove(
    @Param('id') id: string,
    @Body('deletionReason') deletionReason: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.documentsService.remove(id, deletionReason, userId);
  }
}
