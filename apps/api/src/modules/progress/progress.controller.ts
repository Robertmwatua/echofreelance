import { Controller, Get, Param, Post, UseGuards } from '@nestjs/common'
import { AuthUser, CurrentUser } from '../../common/current-user.decorator'
import { JwtAuthGuard } from '../auth/jwt-auth.guard'
import { ProgressService } from './progress.service'

@Controller()
export class ProgressController {
  constructor(private readonly progressService: ProgressService) {}

  @UseGuards(JwtAuthGuard)
  @Get('progress/me')
  overview(@CurrentUser() user: AuthUser) {
    return this.progressService.myOverview(user!.id)
  }

  @UseGuards(JwtAuthGuard)
  @Get('courses/:courseId/progress')
  courseProgress(
    @Param('courseId') courseId: string,
    @CurrentUser() user: AuthUser,
  ) {
    return this.progressService.courseProgress(courseId, user!.id)
  }

  @UseGuards(JwtAuthGuard)
  @Post('lessons/:lessonId/complete')
  complete(@Param('lessonId') lessonId: string, @CurrentUser() user: AuthUser) {
    return this.progressService.completeLesson(lessonId, user!)
  }
}
