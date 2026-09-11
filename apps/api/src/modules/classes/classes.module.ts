import { Module } from '@nestjs/common'
import { NotificationsModule } from '../notifications/notifications.module'
import { ClassesController } from './classes.controller'
import { ClassesService } from './classes.service'
import { JaasService } from './jaas.service'

@Module({
  imports: [NotificationsModule],
  controllers: [ClassesController],
  providers: [ClassesService, JaasService],
  exports: [ClassesService, JaasService],
})
export class ClassesModule {}
