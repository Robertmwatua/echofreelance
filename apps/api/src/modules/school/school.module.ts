import { Module } from '@nestjs/common'
import { SchoolAdminController, SchoolPublicController } from './school.controller'
import { SchoolService } from './school.service'
@Module({controllers:[SchoolPublicController,SchoolAdminController],providers:[SchoolService]})
export class SchoolModule {}
