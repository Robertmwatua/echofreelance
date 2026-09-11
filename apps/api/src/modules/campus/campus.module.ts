import { Module } from '@nestjs/common'
import { NotificationsModule } from '../notifications/notifications.module'
import { CampusController } from './campus.controller'
import { CampusService } from './campus.service'

@Module({
  imports: [NotificationsModule],
  controllers: [CampusController],
  providers: [CampusService],
  exports: [CampusService],
})
export class CampusModule {}
