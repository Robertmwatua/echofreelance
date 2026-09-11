import { Body, Controller, Get, Param, Patch, Post, UseGuards } from '@nestjs/common'
import { Role } from '@prisma/client'
import { AuthUser, CurrentUser } from '../../common/current-user.decorator'
import { Roles } from '../../common/roles.decorator'
import { RolesGuard } from '../../common/roles.guard'
import { JwtAuthGuard } from '../auth/jwt-auth.guard'
import { OptionalJwtAuthGuard } from '../auth/optional-jwt-auth.guard'
import { AssignmentsService } from './assignments.service'
import {
  CreateAssignmentDto,
  GradeSubmissionDto,
  SubmitAssignmentDto,
} from './dto/assignment.dto'

@Controller()
export class AssignmentsController {
  constructor(private readonly assignmentsService: AssignmentsService) {}

  @UseGuards(OptionalJwtAuthGuard)
  @Get('courses/:courseId/assignments')
  listForCourse(
    @Param('courseId') courseId: string,
    @CurrentUser() user: AuthUser | null,
  ) {
    return this.assignmentsService.listForCourse(courseId, user)
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.Tutor, Role.Admin)
  @Post('assignments')
  create(@Body() dto: CreateAssignmentDto, @CurrentUser() user: AuthUser) {
    return this.assignmentsService.create(user!, dto)
  }

  @UseGuards(JwtAuthGuard)
  @Post('assignments/:id/submit')
  submit(
    @Param('id') id: string,
    @Body() dto: SubmitAssignmentDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.assignmentsService.submit(id, user!, dto)
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.Tutor, Role.Admin)
  @Get('assignments/:id/submissions')
  submissions(@Param('id') id: string, @CurrentUser() user: AuthUser) {
    return this.assignmentsService.listSubmissions(id, user!)
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.Tutor, Role.Admin)
  @Patch('submissions/:id/grade')
  grade(
    @Param('id') id: string,
    @Body() dto: GradeSubmissionDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.assignmentsService.grade(id, user!, dto)
  }
}
