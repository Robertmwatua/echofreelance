import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common'
import { Role } from '@prisma/client'
import { AuthUser } from '../../common/current-user.decorator'
import { PrismaService } from '../../prisma/prisma.service'
import { NotificationsService } from '../notifications/notifications.service'
import {
  CreateVirtualClassDto,
  InstantMeetingDto,
  UpdateVirtualClassDto,
} from './dto/virtual-class.dto'

@Injectable()
export class ClassesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notifications: NotificationsService,
  ) {}

  async listUpcoming(userId?: string) {
    const now = new Date()
    const classes = await this.prisma.virtualClass.findMany({
      where: {
        status: { in: ['Scheduled', 'Live'] },
        endsAt: { gte: now },
        course: { published: true },
      },
      include: {
        course: { select: { id: true, title: true, category: true } },
        host: { select: { id: true, name: true, email: true } },
        _count: { select: { attendances: true } },
      },
      orderBy: { startsAt: 'asc' },
      take: 50,
    })

    const registeredIds = userId
      ? new Set(
          (
            await this.prisma.classAttendance.findMany({
              where: {
                userId,
                classId: { in: classes.map((c) => c.id) },
              },
              select: { classId: true },
            })
          ).map((a) => a.classId),
        )
      : new Set<string>()

    return classes.map((c) => ({
      id: c.id,
      title: c.title,
      description: c.description,
      startsAt: c.startsAt,
      endsAt: c.endsAt,
      status: c.status,
      course: c.course,
      host: c.host,
      attendanceCount: c._count.attendances,
      registered: registeredIds.has(c.id),
    }))
  }

  async listMine(user: AuthUser) {
    if (user.role === Role.Tutor || user.role === Role.Admin) {
      return this.prisma.virtualClass.findMany({
        where: user.role === Role.Admin ? {} : { hostId: user.id },
        include: {
          course: { select: { id: true, title: true, category: true } },
          host: { select: { id: true, name: true, email: true } },
          _count: { select: { attendances: true } },
        },
        orderBy: { startsAt: 'desc' },
      })
    }

    const attendances = await this.prisma.classAttendance.findMany({
      where: { userId: user.id },
      include: {
        class: {
          include: {
            course: { select: { id: true, title: true, category: true } },
            host: { select: { id: true, name: true, email: true } },
            _count: { select: { attendances: true } },
          },
        },
      },
      orderBy: { joinedAt: 'desc' },
    })
    return attendances.map((a) => ({
      ...a.class,
      registered: true,
      attendanceCount: a.class._count.attendances,
    }))
  }

  async findOne(id: string, user?: AuthUser | null) {
    const virtualClass = await this.prisma.virtualClass.findUnique({
      where: { id },
      include: {
        course: {
          select: { id: true, title: true, category: true, published: true, tutorId: true },
        },
        host: { select: { id: true, name: true, email: true } },
        _count: { select: { attendances: true } },
      },
    })
    if (!virtualClass) {
      throw new NotFoundException('Virtual class not found')
    }

    const enrolled = user
      ? Boolean(
          await this.prisma.enrollment.findUnique({
            where: {
              userId_courseId: { userId: user.id, courseId: virtualClass.courseId },
            },
          }),
        )
      : false

    const isHost = user?.id === virtualClass.hostId
    const isAdmin = user?.role === Role.Admin
    const registered = user
      ? Boolean(
          await this.prisma.classAttendance.findUnique({
            where: { classId_userId: { classId: id, userId: user.id } },
          }),
        )
      : false

    const canJoin = isHost || isAdmin || registered

    return {
      id: virtualClass.id,
      title: virtualClass.title,
      description: virtualClass.description,
      startsAt: virtualClass.startsAt,
      endsAt: virtualClass.endsAt,
      status: virtualClass.status,
      course: virtualClass.course,
      host: virtualClass.host,
      attendanceCount: virtualClass._count.attendances,
      registered,
      enrolled,
      meetingUrl: canJoin ? virtualClass.meetingUrl : undefined,
      roomUrl: canJoin ? virtualClass.meetingUrl : undefined,
      canManage: isHost || isAdmin,
      canEnterRoom: canJoin,
    }
  }

  async create(user: AuthUser, dto: CreateVirtualClassDto) {
    const course = await this.prisma.course.findUnique({ where: { id: dto.courseId } })
    if (!course) {
      throw new NotFoundException('Course not found')
    }
    if (user.role !== Role.Admin && course.tutorId !== user.id) {
      throw new ForbiddenException('You can only schedule classes for your own courses')
    }
    if (new Date(dto.endsAt) <= new Date(dto.startsAt)) {
      throw new BadRequestException('endsAt must be after startsAt')
    }

    const created = await this.prisma.virtualClass.create({
      data: {
        courseId: dto.courseId,
        hostId: user.id,
        title: dto.title,
        description: dto.description,
        startsAt: new Date(dto.startsAt),
        endsAt: new Date(dto.endsAt),
        meetingUrl: dto.meetingUrl || 'https://meet.jit.si/pending',
      },
      include: {
        course: { select: { id: true, title: true } },
        host: { select: { id: true, name: true, email: true } },
      },
    })

    if (!dto.meetingUrl) {
      return this.prisma.virtualClass.update({
        where: { id: created.id },
        data: {
          meetingUrl: `https://meet.jit.si/EchoFreelance-${created.id}`,
        },
        include: {
          course: { select: { id: true, title: true } },
          host: { select: { id: true, name: true, email: true } },
        },
      })
    }

    return created
  }

  async createInstant(user: AuthUser, dto: InstantMeetingDto) {
    const course = await this.prisma.course.findUnique({ where: { id: dto.courseId } })
    if (!course) {
      throw new NotFoundException('Course not found')
    }
    if (user.role !== Role.Admin && course.tutorId !== user.id) {
      throw new ForbiddenException('You can only start meetings for your own courses')
    }

    const duration = dto.durationMinutes ?? 60
    const startsAt = new Date()
    const endsAt = new Date(startsAt.getTime() + duration * 60 * 1000)
    const title = dto.title?.trim() || `Instant class · ${course.title}`

    const created = await this.prisma.virtualClass.create({
      data: {
        courseId: dto.courseId,
        hostId: user.id,
        title,
        description:
          dto.description?.trim() ||
          'Live session started now. Enrolled students can register and join.',
        startsAt,
        endsAt,
        meetingUrl: 'https://meet.jit.si/pending',
        status: 'Live',
      },
    })

    const meeting = await this.prisma.virtualClass.update({
      where: { id: created.id },
      data: {
        meetingUrl: `https://meet.jit.si/EchoFreelance-${created.id}`,
      },
      include: {
        course: { select: { id: true, title: true, category: true } },
        host: { select: { id: true, name: true, email: true } },
      },
    })

    await this.prisma.classAttendance.upsert({
      where: { classId_userId: { classId: meeting.id, userId: user.id } },
      create: {
        classId: meeting.id,
        userId: user.id,
        enteredAt: new Date(),
      },
      update: { enteredAt: new Date() },
    })

    const enrolled = await this.prisma.enrollment.findMany({
      where: { courseId: dto.courseId },
      select: { userId: true },
    })
    await this.notifications.notifyMany(
      enrolled.map((e) => e.userId).filter((id) => id !== user.id),
      'Live class started',
      `${title} is live now — join from the schedule.`,
      `/classes/${meeting.id}`,
    )

    return {
      ...meeting,
      roomUrl: meeting.meetingUrl,
      meetingUrl: meeting.meetingUrl,
      canEnterRoom: true,
      canManage: true,
      registered: true,
    }
  }

  async enterRoom(id: string, user: AuthUser) {
    const detail = await this.findOne(id, user)
    if (!detail.canEnterRoom) {
      throw new ForbiddenException('Register for this class to enter the live room')
    }
    if (detail.status === 'Scheduled') {
      await this.prisma.virtualClass.update({
        where: { id },
        data: { status: 'Live' },
      })
    }

    await this.prisma.classAttendance.upsert({
      where: { classId_userId: { classId: id, userId: user.id } },
      create: {
        classId: id,
        userId: user.id,
        enteredAt: new Date(),
      },
      update: {
        enteredAt: new Date(),
      },
    })

    return {
      ...detail,
      status: detail.status === 'Scheduled' ? 'Live' : detail.status,
      roomUrl: detail.meetingUrl,
    }
  }

  async roster(id: string, user: AuthUser) {
    const virtualClass = await this.prisma.virtualClass.findUnique({
      where: { id },
      include: { course: true },
    })
    if (!virtualClass) throw new NotFoundException('Virtual class not found')
    if (user.role !== Role.Admin && virtualClass.hostId !== user.id) {
      throw new ForbiddenException('Only the host can view attendance')
    }

    const rows = await this.prisma.classAttendance.findMany({
      where: { classId: id },
      include: {
        user: { select: { id: true, name: true, email: true } },
      },
      orderBy: { joinedAt: 'asc' },
    })

    return {
      classId: id,
      title: virtualClass.title,
      registered: rows.length,
      entered: rows.filter((r) => r.enteredAt).length,
      attendees: rows.map((r) => ({
        id: r.user.id,
        name: r.user.name,
        email: r.user.email,
        registeredAt: r.joinedAt,
        enteredAt: r.enteredAt,
        attended: Boolean(r.enteredAt),
      })),
    }
  }

  async update(id: string, user: AuthUser, dto: UpdateVirtualClassDto) {
    const virtualClass = await this.prisma.virtualClass.findUnique({ where: { id } })
    if (!virtualClass) {
      throw new NotFoundException('Virtual class not found')
    }
    if (user.role !== Role.Admin && virtualClass.hostId !== user.id) {
      throw new ForbiddenException('Only the host or admin can update this class')
    }

    return this.prisma.virtualClass.update({
      where: { id },
      data: {
        ...(dto.title !== undefined ? { title: dto.title } : {}),
        ...(dto.description !== undefined ? { description: dto.description } : {}),
        ...(dto.startsAt !== undefined ? { startsAt: new Date(dto.startsAt) } : {}),
        ...(dto.endsAt !== undefined ? { endsAt: new Date(dto.endsAt) } : {}),
        ...(dto.meetingUrl !== undefined ? { meetingUrl: dto.meetingUrl } : {}),
        ...(dto.recordingUrl !== undefined ? { recordingUrl: dto.recordingUrl } : {}),
        ...(dto.status !== undefined ? { status: dto.status as never } : {}),
      },
    })
  }

  async register(id: string, userId: string) {
    const virtualClass = await this.prisma.virtualClass.findUnique({
      where: { id },
      include: { course: true },
    })
    if (!virtualClass || virtualClass.status === 'Cancelled') {
      throw new NotFoundException('Virtual class not found')
    }

    const enrollment = await this.prisma.enrollment.findUnique({
      where: {
        userId_courseId: { userId, courseId: virtualClass.courseId },
      },
    })
    if (!enrollment) {
      throw new ForbiddenException('Enroll in the course before joining this class')
    }

    return this.prisma.classAttendance.upsert({
      where: { classId_userId: { classId: id, userId } },
      create: { classId: id, userId },
      update: {},
      include: {
        class: { select: { id: true, title: true, meetingUrl: true, startsAt: true } },
      },
    })
  }
}
