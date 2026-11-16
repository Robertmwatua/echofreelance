import {Module} from '@nestjs/common'
import {CampusModule} from '../campus/campus.module'
import {NotificationsModule} from '../notifications/notifications.module'
import {LearningController} from './learning.controller'
import {LearningService} from './learning.service'
@Module({imports:[CampusModule,NotificationsModule],controllers:[LearningController],providers:[LearningService]})
export class LearningModule{}
