import { Controller, Get, UseGuards, Request } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { WorkService } from './work.service';

interface RequestWithUser {
  user: { id: string; email: string; role: string };
}

@ApiTags('Work')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('work')
export class WorkController {
  constructor(private readonly workService: WorkService) {}

  @Get('summary')
  @ApiOperation({ summary: 'Advisor work queue summary (today + priorities)' })
  async getSummary(@Request() req: RequestWithUser) {
    // For now, we scope to the current user where possible.
    return this.workService.getSummary(req.user.id);
  }
}
