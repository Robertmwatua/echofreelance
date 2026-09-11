import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common'
import { Role } from '@prisma/client'
import { AuthUser, CurrentUser } from '../../common/current-user.decorator'
import { Roles } from '../../common/roles.decorator'
import { RolesGuard } from '../../common/roles.guard'
import { JwtAuthGuard } from '../auth/jwt-auth.guard'
import { OptionalJwtAuthGuard } from '../auth/optional-jwt-auth.guard'
import { CampusService } from './campus.service'
import {
  CreateAnnouncementDto,
  CreateResourceDto,
  CreateReviewDto,
} from './dto/campus.dto'

@Controller()
export class CampusController {
  constructor(private readonly campusService: CampusService) {}

  @Get('courses/:courseId/reviews')
  reviews(@Param('courseId') courseId: string) {
    return this.campusService.listReviews(courseId)
  }

  @UseGuards(JwtAuthGuard)
  @Post('courses/:courseId/reviews')
  review(
    @Param('courseId') courseId: string,
    @Body() dto: CreateReviewDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.campusService.upsertReview(courseId, user!, dto)
  }

  @Get('courses/:courseId/announcements')
  announcements(@Param('courseId') courseId: string) {
    return this.campusService.listAnnouncements(courseId)
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.Tutor, Role.Admin)
  @Post('announcements')
  createAnnouncement(
    @Body() dto: CreateAnnouncementDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.campusService.createAnnouncement(user!, dto)
  }

  @Get('lessons/:lessonId/resources')
  resources(@Param('lessonId') lessonId: string) {
    return this.campusService.listResources(lessonId)
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.Tutor, Role.Admin)
  @Post('resources')
  addResource(@Body() dto: CreateResourceDto, @CurrentUser() user: AuthUser) {
    return this.campusService.addResource(user!, dto)
  }

  @UseGuards(JwtAuthGuard)
  @Get('certificates/mine')
  myCerts(@CurrentUser() user: AuthUser) {
    return this.campusService.myCertificates(user!.id)
  }

  @UseGuards(JwtAuthGuard)
  @Post('courses/:courseId/certificate')
  claim(
    @Param('courseId') courseId: string,
    @CurrentUser() user: AuthUser,
  ) {
    return this.campusService.claimCertificate(courseId, user!)
  }

  @Get('certificates/:code')
  getCert(@Param('code') code: string) {
    return this.campusService.getCertificate(code)
  }
}
