import { Body, Controller, Get, Param, Post, Query, UseGuards } from '@nestjs/common'
import { Role } from '@prisma/client'
import { AuthUser, CurrentUser } from '../../common/current-user.decorator'
import { Roles } from '../../common/roles.decorator'
import { RolesGuard } from '../../common/roles.guard'
import { JwtAuthGuard } from '../auth/jwt-auth.guard'
import { OptionalJwtAuthGuard } from '../auth/optional-jwt-auth.guard'
import { ChallengesService } from './challenges.service'
import { CreateChallengeDto, SubmitFlagDto } from './dto/challenge.dto'

@Controller('challenges')
export class ChallengesController {
  constructor(private readonly challengesService: ChallengesService) {}

  @UseGuards(OptionalJwtAuthGuard)
  @Get()
  list(
    @CurrentUser() user: AuthUser | null,
    @Query('category') category?: string,
  ) {
    return this.challengesService.list(user?.id, category)
  }

  @Get('leaderboard')
  leaderboard(@Query('limit') limit?: string) {
    return this.challengesService.leaderboard(limit ? Number(limit) : 20)
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.Tutor, Role.Admin)
  @Get('mine')
  mine(@CurrentUser() user: AuthUser) {
    return this.challengesService.mine(user!.id)
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.Tutor, Role.Admin)
  @Post()
  create(@Body() dto: CreateChallengeDto, @CurrentUser() user: AuthUser) {
    return this.challengesService.create(user!, dto)
  }

  @UseGuards(OptionalJwtAuthGuard)
  @Get(':slug')
  findOne(@Param('slug') slug: string, @CurrentUser() user: AuthUser | null) {
    return this.challengesService.findBySlug(slug, user?.id)
  }

  @UseGuards(JwtAuthGuard)
  @Post(':slug/submit')
  submit(
    @Param('slug') slug: string,
    @Body() dto: SubmitFlagDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.challengesService.submitFlag(slug, user!, dto)
  }
}
