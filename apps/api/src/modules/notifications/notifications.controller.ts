import { Controller, Get, Param, Patch, UseGuards } from '@nestjs/common'
import { AuthUser, CurrentUser } from '../../common/current-user.decorator'
import { JwtAuthGuard } from '../auth/jwt-auth.guard'
import { NotificationsService } from './notifications.service'

@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @UseGuards(JwtAuthGuard)
  @Get()
  list(@CurrentUser() user: AuthUser) {
    return this.notificationsService.list(user!.id)
  }

  @UseGuards(JwtAuthGuard)
  @Get('unread-count')
  unread(@CurrentUser() user: AuthUser) {
    return this.notificationsService.unreadCount(user!.id).then((count) => ({ count }))
  }

  @UseGuards(JwtAuthGuard)
  @Patch('read')
  markAll(@CurrentUser() user: AuthUser) {
    return this.notificationsService.markRead(user!.id)
  }

  @UseGuards(JwtAuthGuard)
  @Patch(':id/read')
  markOne(@Param('id') id: string, @CurrentUser() user: AuthUser) {
    return this.notificationsService.markRead(user!.id, id)
  }
}
