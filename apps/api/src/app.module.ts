import {LearningModule} from './modules/learning/learning.module'
import { SchoolModule } from './modules/school/school.module'
import { PaymentsModule } from './modules/payments/payments.module'
import { Module } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'
import { HealthController } from './health.controller'
import { AssignmentsModule } from './modules/assignments/assignments.module'
import { AuthModule } from './modules/auth/auth.module'
import { CampusModule } from './modules/campus/campus.module'
import { ClassesModule } from './modules/classes/classes.module'
import { CommunityModule } from './modules/community/community.module'
import { CoursesModule } from './modules/courses/courses.module'
import { NotificationsModule } from './modules/notifications/notifications.module'
import { ProgressModule } from './modules/progress/progress.module'
import { UsersModule } from './modules/users/users.module'
import { PrismaModule } from './prisma/prisma.module'

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    UsersModule,
    AuthModule,
    CoursesModule,
    ClassesModule,
    ProgressModule,
    AssignmentsModule,
    NotificationsModule,
    CampusModule,
    CommunityModule,
    PaymentsModule,
    SchoolModule,
    LearningModule,
  ],
  controllers: [HealthController],
})
export class AppModule {}
