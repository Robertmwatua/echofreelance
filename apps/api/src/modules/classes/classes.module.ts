import { Module } from '@nestjs/common'
import { NotificationsModule } from '../notifications/notifications.module'
import { ClassesController } from './classes.controller'
import { ClassesService } from './classes.service'

@Module({
  imports: [NotificationsModule],
  controllers: [ClassesController],
  providers: [ClassesService],
  exports: [ClassesService],
})
export class ClassesModule {}
