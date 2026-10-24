import { Controller, Get } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { DashboardService, type DashboardOverview } from './dashboard.service';

@ApiTags('Dashboard')
@ApiBearerAuth()
@Controller('dashboard')
export class DashboardController {
  constructor(private readonly dashboard: DashboardService) {}

  @Get('overview')
  @ApiOperation({ summary: 'Project and task summary for the dashboard' })
  getOverview(): Promise<DashboardOverview> {
    return this.dashboard.getOverview();
  }
}
