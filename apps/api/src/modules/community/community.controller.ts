import { Body, Controller, Get, Param, Post, Put, UseGuards } from '@nestjs/common'
import { AuthUser, CurrentUser } from '../../common/current-user.decorator'
import { JwtAuthGuard } from '../auth/jwt-auth.guard'
import { OptionalJwtAuthGuard } from '../auth/optional-jwt-auth.guard'
import { CommunityService } from './community.service'
import { CreateDiscussionDto, UpsertNoteDto } from './dto/community.dto'

@Controller()
export class CommunityController {
  constructor(private readonly community: CommunityService) {}

  @UseGuards(OptionalJwtAuthGuard)
  @Get('courses/:courseId/discussions')
  list(@Param('courseId') courseId: string) {
    return this.community.listDiscussions(courseId)
  }

  @UseGuards(JwtAuthGuard)
  @Post('courses/:courseId/discussions')
  create(
    @Param('courseId') courseId: string,
    @Body() dto: CreateDiscussionDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.community.createDiscussion(courseId, user!, dto)
  }

  @UseGuards(JwtAuthGuard)
  @Get('notes/mine')
  myNotes(@CurrentUser() user: AuthUser) {
    return this.community.myNotes(user!.id)
  }

  @UseGuards(JwtAuthGuard)
  @Get('lessons/:lessonId/notes')
  getNote(@Param('lessonId') lessonId: string, @CurrentUser() user: AuthUser) {
    return this.community.getNote(lessonId, user!.id)
  }

  @UseGuards(JwtAuthGuard)
  @Put('lessons/:lessonId/notes')
  upsertNote(
    @Param('lessonId') lessonId: string,
    @Body() dto: UpsertNoteDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.community.upsertNote(lessonId, user!, dto)
  }
}
