import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Put,
  Query,
  Request,
  UseGuards,
  ParseUUIDPipe,
  Headers,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { MoneyMovementsService } from './money-movements.service';
import {
  CreateMoneyMovementRequestDto,
  InitiateMoneyMovementDto,
  MoneyMovementFilterDto,
  UpdateMoneyMovementRequestDto,
} from './dto/money-movement.dto';

interface RequestWithUser {
  user: { id: string; email: string; role: string };
}

@ApiTags('MoneyMovements')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('money-movements')
export class MoneyMovementsController {
  constructor(private readonly service: MoneyMovementsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a money movement request' })
  @ApiResponse({ status: 201 })
  async create(@Body() dto: CreateMoneyMovementRequestDto, @Request() req: RequestWithUser) {
    return this.service.create(dto, req.user.id);
  }

  @Get()
  @ApiOperation({ summary: 'List money movement requests (filterable)' })
  async findAll(@Query() filter: MoneyMovementFilterDto) {
    return this.service.findAll(filter);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a money movement request' })
  async findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.service.findOne(id);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update a money movement request (non-status fields)' })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateMoneyMovementRequestDto,
    @Request() req: RequestWithUser,
  ) {
    return this.service.update(id, dto, req.user.id);
  }

  @Post(':id/approve')
  @ApiOperation({ summary: 'Approve a money movement request' })
  async approve(@Param('id', ParseUUIDPipe) id: string, @Request() req: RequestWithUser) {
    return this.service.approve(id, req.user.id);
  }

  @Post(':id/initiate')
  @ApiOperation({ summary: 'Initiate a money movement request (generate package + prefill)' })
  async initiate(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: InitiateMoneyMovementDto,
    @Request() req: RequestWithUser,
    @Headers('idempotency-key') idempotencyKey?: string,
  ) {
    return this.service.initiate(id, dto, req.user.id, idempotencyKey);
  }

  @Post(':id/confirm')
  @ApiOperation({ summary: 'Mark a money movement request as confirmed' })
  async confirm(@Param('id', ParseUUIDPipe) id: string, @Request() req: RequestWithUser) {
    return this.service.confirm(id, req.user.id);
  }

  @Post(':id/close')
  @ApiOperation({ summary: 'Close a money movement request' })
  async close(@Param('id', ParseUUIDPipe) id: string, @Request() req: RequestWithUser) {
    return this.service.close(id, req.user.id);
  }

  @Post(':id/cancel')
  @ApiOperation({ summary: 'Cancel a money movement request' })
  async cancel(@Param('id', ParseUUIDPipe) id: string, @Request() req: RequestWithUser) {
    return this.service.cancel(id, req.user.id);
  }
}
