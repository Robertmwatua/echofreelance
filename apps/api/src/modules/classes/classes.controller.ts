import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common'
import { Role } from '@prisma/client'
import { AuthUser, CurrentUser } from '../../common/current-user.decorator'
import { Roles } from '../../common/roles.decorator'
import { RolesGuard } from '../../common/roles.guard'
import { JwtAuthGuard } from '../auth/jwt-auth.guard'
import { OptionalJwtAuthGuard } from '../auth/optional-jwt-auth.guard'
import { ClassesService } from './classes.service'
import {
  CreateVirtualClassDto,
  InstantMeetingDto,
  UpdateVirtualClassDto,
} from './dto/virtual-class.dto'

@Controller('classes')
export class ClassesController {
  constructor(private readonly classesService: ClassesService) {}

  @UseGuards(OptionalJwtAuthGuard)
  @Get()
  list(@CurrentUser() user: AuthUser | null) {
    return this.classesService.listUpcoming(user?.id)
  }

  @UseGuards(JwtAuthGuard)
  @Get('mine')
  mine(@CurrentUser() user: AuthUser) {
    return this.classesService.listMine(user)
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.Tutor, Role.Admin)
  @Get('live-status')
  liveStatus() {
    return this.classesService.liveClassroomStatus()
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.Tutor, Role.Admin)
  @Post('instant')
  instant(@Body() dto: InstantMeetingDto, @CurrentUser() user: AuthUser) {
    return this.classesService.createInstant(user!, dto)
  }

  @UseGuards(OptionalJwtAuthGuard)
  @Get(':id')
  findOne(@Param('id') id: string, @CurrentUser() user: AuthUser | null) {
    return this.classesService.findOne(id, user)
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.Tutor, Role.Admin)
  @Post()
  create(@Body() dto: CreateVirtualClassDto, @CurrentUser() user: AuthUser) {
    return this.classesService.create(user, dto)
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.Tutor, Role.Admin)
  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() dto: UpdateVirtualClassDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.classesService.update(id, user, dto)
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.Tutor, Role.Admin)
  @Get(':id/roster')
  roster(@Param('id') id: string, @CurrentUser() user: AuthUser) {
    return this.classesService.roster(id, user!)
  }

  @UseGuards(JwtAuthGuard)
  @Post(':id/enter')
  enter(@Param('id') id: string, @CurrentUser() user: AuthUser) {
    return this.classesService.enterRoom(id, user!)
  }

  @UseGuards(JwtAuthGuard)
  @Post(':id/register')
  register(@Param('id') id: string, @CurrentUser() user: AuthUser) {
    return this.classesService.register(id, user!.id)
  }
}
