import {CampusModule} from '../campus/campus.module'
import { Module } from '@nestjs/common'
import { NotificationsModule } from '../notifications/notifications.module'
import { AssignmentsController } from './assignments.controller'
import { AssignmentsService } from './assignments.service'

@Module({
  imports: [NotificationsModule,CampusModule],
  controllers: [AssignmentsController],
  providers: [AssignmentsService],
  exports: [AssignmentsService],
})
export class AssignmentsModule {}
