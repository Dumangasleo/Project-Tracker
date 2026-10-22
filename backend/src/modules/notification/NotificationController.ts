import {
    Controller,
    Get,
    Param,
    Patch,
    Query,
    ParseIntPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { NotificationService } from './NotificationService';
import { CurrentUser } from '../auth/CurrentUser';
import type { JwtPayload } from '../auth/JwtPayload';

/**
 * HTTP read API, served by the MAIN app (:3001). Protected by the global
 * JwtAuthGuard, so the member is taken from the JWT — no client-supplied id.
 * The writes happen out-of-band in the notification microservice.
 */
@ApiTags('Notifications')
@ApiBearerAuth()
@Controller('notifications')
export class NotificationController {
    constructor(private readonly notificationService: NotificationService) {}

    @Get()
    @ApiOperation({ summary: 'Get MY notifications (newest first)' })
    @ApiQuery({ name: 'unreadOnly', required: false, type: Boolean })
    findMine(
        @CurrentUser() user: JwtPayload,
        @Query('unreadOnly') unreadOnly?: string,
    ) {
        return this.notificationService.findForMember(
            user.sub,
            unreadOnly === 'true',
        );
    }

    @Patch('read-all')
    @ApiOperation({ summary: 'Mark all of MY notifications as read' })
    markAllRead(@CurrentUser() user: JwtPayload) {
        return this.notificationService.markAllRead(user.sub);
    }

    @Patch(':id/read')
    @ApiOperation({ summary: 'Mark one notification as read' })
    markAsRead(@Param('id', ParseIntPipe) id: number) {
        return this.notificationService.markAsRead(id);
    }
}
