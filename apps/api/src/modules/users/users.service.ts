import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common'
import { Role } from '@prisma/client'
import * as bcrypt from 'bcryptjs'
import { PrismaService } from '../../prisma/prisma.service'
import {
  AdminResetPasswordDto,
  AdminUpdateUserDto,
  ChangePasswordDto,
  UpdateProfileDto,
} from './dto/settings.dto'

const publicSelect = {
  id: true,
  email: true,
  name: true,
  role: true,
  bio: true,
  headline: true,
  createdAt: true,
  updatedAt: true,
} as const

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async findById(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: publicSelect,
    })
    if (!user) {
      throw new NotFoundException('User not found')
    }
    return user
  }

  async list() {
    return this.prisma.user.findMany({
      select: {
        ...publicSelect,
        _count: {
          select: {
            enrollments: true,
            coursesTaught: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    })
  }

  async updateProfile(id: string, dto: UpdateProfileDto) {
    return this.prisma.user.update({
      where: { id },
      data: {
        ...(dto.name !== undefined ? { name: dto.name.trim() } : {}),
        ...(dto.headline !== undefined ? { headline: dto.headline.trim() || null } : {}),
        ...(dto.bio !== undefined ? { bio: dto.bio.trim() || null } : {}),
      },
      select: publicSelect,
    })
  }

  async changePassword(id: string, dto: ChangePasswordDto) {
    const user = await this.prisma.user.findUnique({ where: { id } })
    if (!user) {
      throw new NotFoundException('User not found')
    }
    const ok = await bcrypt.compare(dto.currentPassword, user.passwordHash)
    if (!ok) {
      throw new UnauthorizedException('Current password is incorrect')
    }
    if (dto.currentPassword === dto.newPassword) {
      throw new BadRequestException('New password must be different')
    }
    const passwordHash = await bcrypt.hash(dto.newPassword, 10)
    await this.prisma.user.update({
      where: { id },
      data: { passwordHash },
    })
    return { ok: true, message: 'Password updated' }
  }

  async adminResetPassword(id: string, dto: AdminResetPasswordDto) {
    const user = await this.prisma.user.findUnique({ where: { id } })
    if (!user) {
      throw new NotFoundException('User not found')
    }
    const passwordHash = await bcrypt.hash(dto.newPassword, 10)
    await this.prisma.user.update({
      where: { id },
      data: { passwordHash },
    })
    return { ok: true, message: 'Password reset' }
  }

  async adminUpdateUser(id: string, dto: AdminUpdateUserDto) {
    const user = await this.prisma.user.findUnique({ where: { id } })
    if (!user) {
      throw new NotFoundException('User not found')
    }
    if (dto.email && dto.email.toLowerCase() !== user.email) {
      const taken = await this.prisma.user.findUnique({
        where: { email: dto.email.toLowerCase() },
      })
      if (taken) {
        throw new BadRequestException('Email already in use')
      }
    }
    const data: {
      name?: string
      email?: string
      passwordHash?: string
    } = {}
    if (dto.name !== undefined) data.name = dto.name.trim()
    if (dto.email !== undefined) data.email = dto.email.toLowerCase()
    if (dto.newPassword) {
      data.passwordHash = await bcrypt.hash(dto.newPassword, 10)
    }
    return this.prisma.user.update({
      where: { id },
      data,
      select: publicSelect,
    })
  }

  async updateRole(id: string, role: Role | 'Student' | 'Tutor' | 'Admin', actorId: string) {
    const nextRole = role as Role
    if (id === actorId && nextRole !== Role.Admin) {
      throw new ForbiddenException('Admins cannot demote themselves')
    }
    const user = await this.prisma.user.findUnique({ where: { id } })
    if (!user) {
      throw new NotFoundException('User not found')
    }
    return this.prisma.user.update({
      where: { id },
      data: { role: nextRole },
      select: publicSelect,
    })
  }

  async adminStats() {
    const [students, tutors, admins, courses, publishedCourses, enrollments, classes] =
      await Promise.all([
        this.prisma.user.count({ where: { role: Role.Student } }),
        this.prisma.user.count({ where: { role: Role.Tutor } }),
        this.prisma.user.count({ where: { role: Role.Admin } }),
        this.prisma.course.count(),
        this.prisma.course.count({ where: { published: true } }),
        this.prisma.enrollment.count(),
        this.prisma.virtualClass.count({
          where: { status: { in: ['Scheduled', 'Live'] } },
        }),
      ])

    return {
      students,
      tutors,
      admins,
      courses,
      publishedCourses,
      enrollments,
      upcomingClasses: classes,
    }
  }
}
