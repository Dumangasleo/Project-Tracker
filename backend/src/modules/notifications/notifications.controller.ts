import {
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseBoolPipe,
  ParseIntPipe,
  Patch,
  Query,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { AuthUser } from '../../common/interfaces/auth-user.interface';
import { Notification } from './entities/notification.entity';
import { NotificationsService } from './notifications.service';

@ApiTags('Notifications')
@ApiBearerAuth()
@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notifications: NotificationsService) {}

  @Get()
  @ApiOperation({ summary: 'List my notifications, newest first' })
  @ApiQuery({ name: 'unreadOnly', required: false, type: Boolean })
  findMine(
    @CurrentUser() user: AuthUser,
    @Query('unreadOnly', new ParseBoolPipe({ optional: true }))
    unreadOnly?: boolean,
  ): Promise<Notification[]> {
    return this.notifications.findForMember(user.id, unreadOnly);
  }

  @Patch('read-all')
  @ApiOperation({ summary: 'Mark all my notifications as read' })
  markAllRead(@CurrentUser() user: AuthUser): Promise<{ updated: number }> {
    return this.notifications.markAllRead(user.id);
  }

  @Patch(':id/read')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Mark one of my notifications as read' })
  markAsRead(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: AuthUser,
  ): Promise<void> {
    return this.notifications.markAsRead(id, user.id);
  }
}
