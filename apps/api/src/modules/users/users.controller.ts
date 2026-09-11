import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  UseGuards,
} from '@nestjs/common'
import { Role } from '@prisma/client'
import { AuthUser, CurrentUser } from '../../common/current-user.decorator'
import { Roles } from '../../common/roles.decorator'
import { RolesGuard } from '../../common/roles.guard'
import { UpdateRoleDto } from '../auth/dto/auth.dto'
import { JwtAuthGuard } from '../auth/jwt-auth.guard'
import {
  AdminResetPasswordDto,
  AdminUpdateUserDto,
  ChangePasswordDto,
  UpdateProfileDto,
} from './dto/settings.dto'
import { UsersService } from './users.service'

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @UseGuards(JwtAuthGuard)
  @Get('me')
  me(@CurrentUser() user: AuthUser) {
    return this.usersService.findById(user!.id)
  }

  @UseGuards(JwtAuthGuard)
  @Patch('me')
  updateMe(@CurrentUser() user: AuthUser, @Body() dto: UpdateProfileDto) {
    return this.usersService.updateProfile(user!.id, dto)
  }

  @UseGuards(JwtAuthGuard)
  @Patch('me/password')
  changePassword(@CurrentUser() user: AuthUser, @Body() dto: ChangePasswordDto) {
    return this.usersService.changePassword(user!.id, dto)
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.Admin)
  @Get('stats')
  stats() {
    return this.usersService.adminStats()
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.Admin)
  @Get()
  list() {
    return this.usersService.list()
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.Admin)
  @Patch(':id/role')
  updateRole(
    @Param('id') id: string,
    @Body() dto: UpdateRoleDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.usersService.updateRole(id, dto.role, user!.id)
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.Admin)
  @Patch(':id/password')
  resetPassword(@Param('id') id: string, @Body() dto: AdminResetPasswordDto) {
    return this.usersService.adminResetPassword(id, dto)
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.Admin)
  @Patch(':id')
  adminUpdate(@Param('id') id: string, @Body() dto: AdminUpdateUserDto) {
    return this.usersService.adminUpdateUser(id, dto)
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.Admin)
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.usersService.findById(id)
  }
}
