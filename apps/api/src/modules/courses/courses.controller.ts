import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common'
import { Role } from '@prisma/client'
import { AuthUser, CurrentUser } from '../../common/current-user.decorator'
import { Roles } from '../../common/roles.decorator'
import { RolesGuard } from '../../common/roles.guard'
import { JwtAuthGuard } from '../auth/jwt-auth.guard'
import { OptionalJwtAuthGuard } from '../auth/optional-jwt-auth.guard'
import { CoursesService } from './courses.service'
import {
  CreateCourseDto,
  CreateLessonDto,
  UpdateCourseDto,
} from './dto/create-course.dto'
import { NotifyCourseDto } from './dto/notify-course.dto'

@Controller('courses')
export class CoursesController {
  constructor(private readonly coursesService: CoursesService) {}

  @UseGuards(OptionalJwtAuthGuard)
  @Get()
  list(
    @CurrentUser() user: AuthUser | null,
    @Query('category') category?: string,
    @Query('q') q?: string,
  ) {
    return this.coursesService.list(user?.id, category, q)
  }

  @UseGuards(JwtAuthGuard)
  @Get('mine')
  mine(@CurrentUser() user: AuthUser) {
    return this.coursesService.myCourses(user.id)
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.Tutor, Role.Admin)
  @Get('taught')
  taught(@CurrentUser() user: AuthUser) {
    if (user!.role === Role.Admin) {
      return this.coursesService.listAllAdmin()
    }
    return this.coursesService.listTaughtBy(user!.id)
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.Tutor, Role.Admin)
  @Get(':id/students')
  students(@Param('id') id: string, @CurrentUser() user: AuthUser) {
    return this.coursesService.studentPerformance(id, user!)
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.Tutor, Role.Admin)
  @Post(':id/notify')
  notify(
    @Param('id') id: string,
    @Body() dto: NotifyCourseDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.coursesService.notifyEnrolled(id, user!, dto)
  }

  @UseGuards(OptionalJwtAuthGuard)
  @Get(':id')
  findOne(@Param('id') id: string, @CurrentUser() user: AuthUser | null) {
    return this.coursesService.findOne(id, user?.id, user?.role)
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.Tutor, Role.Admin)
  @Post()
  create(@Body() dto: CreateCourseDto, @CurrentUser() user: AuthUser) {
    return this.coursesService.create(user.id, dto)
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.Tutor, Role.Admin)
  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() dto: UpdateCourseDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.coursesService.update(id, user, dto)
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.Tutor, Role.Admin)
  @Delete(':id')
  remove(@Param('id') id: string, @CurrentUser() user: AuthUser) {
    return this.coursesService.remove(id, user)
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.Tutor, Role.Admin)
  @Post(':id/lessons')
  addLesson(
    @Param('id') id: string,
    @Body() dto: CreateLessonDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.coursesService.addLesson(id, user, dto)
  }

  @UseGuards(JwtAuthGuard)
  @Post(':id/enroll')
  enroll(@Param('id') id: string, @CurrentUser() user: AuthUser) {
    return this.coursesService.enroll(id, user.id)
  }
}
