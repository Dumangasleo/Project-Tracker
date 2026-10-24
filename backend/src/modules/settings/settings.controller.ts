import { Controller, Get } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';

export interface AboutInfo {
  name: string;
  version: string;
  description: string;
}

const ABOUT: AboutInfo = {
  name: 'Vortex Sync',
  version: '1.0.0',
  description: 'A central hub for team collaboration and project tracking.',
};

@ApiTags('Settings')
@ApiBearerAuth()
@Controller('settings')
export class SettingsController {
  @Get('about')
  @ApiOperation({ summary: 'Application information' })
  about(): AboutInfo {
    return ABOUT;
  }
}
