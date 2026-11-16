import {
  ConflictException,
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  ServiceUnavailableException,
} from '@nestjs/common'
import { Role } from '@prisma/client'
import { AuthUser } from '../../common/current-user.decorator'
import { PrismaService } from '../../prisma/prisma.service'
import { NotificationsService } from '../notifications/notifications.service'
import {
  ClassNoteDto,
  ClassReminderDto,
  CreateVirtualClassDto,
  InstantMeetingDto,
  UpdateVirtualClassDto,
} from './dto/virtual-class.dto'
import { JaasService } from './jaas.service'

@Injectable()
export class ClassesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notifications: NotificationsService,
    private readonly jaas: JaasService,
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

    const active = !['Completed', 'Cancelled'].includes(virtualClass.status) && virtualClass.endsAt > new Date()
    const canJoin = active && (isHost || isAdmin || (registered && enrolled && virtualClass.status === 'Live'))
    const canSeeRecording = canJoin || enrolled || isHost || isAdmin

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
      recordingUrl: canSeeRecording ? virtualClass.recordingUrl : undefined,
      meetingUrl: canJoin ? virtualClass.meetingUrl : undefined,
      roomUrl: canJoin ? virtualClass.meetingUrl : undefined,
      canManage: isHost || isAdmin,
      canEnterRoom: canJoin,
    }
  }

  private async checkSlot(tx:any,hostId:string,startsAt:Date,endsAt:Date,exclude?:string){
    if(endsAt<=startsAt)throw new BadRequestException('End time must be after start time.')
    await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${hostId}))`
    const overlap=await tx.virtualClass.findFirst({where:{hostId,id:exclude?{not:exclude}:undefined,status:{in:['Scheduled','Live']},startsAt:{lt:endsAt},endsAt:{gt:startsAt}}})
    if(overlap)throw new ConflictException(`This tutor already has “${overlap.title}” during that time. Choose another time.`)
  }

  async create(user: AuthUser, dto: CreateVirtualClassDto) {
    const course = await this.prisma.course.findUnique({ where: { id: dto.courseId } })
    if (!course) {
      throw new NotFoundException('Course not found')
    }
    if (user.role !== Role.Admin && course.tutorId !== user.id) {
      throw new ForbiddenException('You can only schedule classes for your own courses')
    }
    if (!dto.meetingUrl && !this.jaas.isConfigured()) {
      throw new ServiceUnavailableException('Live classroom is not configured. Ask the administrator to check JaaS settings.')
    }
    if (new Date(dto.endsAt) <= new Date(dto.startsAt)) {
      throw new BadRequestException('endsAt must be after startsAt')
    }

    const created = await this.prisma.$transaction(async tx=>{
      await this.checkSlot(tx,user.id,new Date(dto.startsAt),new Date(dto.endsAt))
      return tx.virtualClass.create({
      data: {
        courseId: dto.courseId,
        hostId: user.id,
        title: dto.title,
        description: dto.description,
        startsAt: new Date(dto.startsAt),
        endsAt: new Date(dto.endsAt),
        meetingUrl: dto.meetingUrl || 'jaas:pending',
      },
      include: {
        course: { select: { id: true, title: true } },
        host: { select: { id: true, name: true, email: true } },
      },
    })
    })

    if (!dto.meetingUrl) {
      const provisioned=await this.prisma.virtualClass.update({
        where: { id: created.id },
        data: {
          meetingUrl: this.jaas.meetingUrlForClass(created.id),
        },
        include: {
          course: { select: { id: true, title: true } },
          host: { select: { id: true, name: true, email: true } },
        },
      })
      await this.announceClass(created.courseId,created.id,"Class scheduled",created.title)
      return provisioned
    }

    await this.announceClass(created.courseId,created.id,"Class scheduled",created.title)
    return created
  }

  liveClassroomStatus() {
    return this.jaas.status()
  }

  async createInstant(user: AuthUser, dto: InstantMeetingDto) {
    // Fail fast with a clear message before writing a Live class row
    if (!this.jaas.isConfigured()) {
      throw new ServiceUnavailableException(
        'Live classroom is not configured. Set JAAS_APP_ID, JAAS_API_KEY_ID, and JAAS_PRIVATE_KEY on the API (Render).',
      )
    }

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

    const created = await this.prisma.$transaction(async tx=>{
      await this.checkSlot(tx,user.id,startsAt,endsAt)
      return tx.virtualClass.create({
      data: {
        courseId: dto.courseId,
        hostId: user.id,
        title,
        description:
          dto.description?.trim() ||
          'Live session started now. Enrolled students can register and join.',
        startsAt,
        endsAt,
        meetingUrl: 'jaas:pending',
        status: 'Live',
      },
    })
    })

    const meeting = await this.prisma.virtualClass.update({
      where: { id: created.id },
      data: {
        meetingUrl: this.jaas.meetingUrlForClass(created.id),
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
    try {
      await this.notifications.notifyMany(
        enrolled.map((e) => e.userId).filter((id) => id !== user.id),
        'Live class started',
        `${title} is live now — join from the schedule.`,
        `/classes/${meeting.id}`,
      )
    } catch {
      // Don't block starting the room if notifications fail
    }

    const { roomUrl } = this.jaas.buildParticipantToken(user, meeting.id, true)

    return {
      ...meeting,
      roomUrl,
      meetingUrl: meeting.meetingUrl,
      canEnterRoom: true,
      canManage: true,
      registered: true,
    }
  }

  async enterRoom(id: string, user: AuthUser) {
    const detail = await this.findOne(id, user)
    if (['Completed', 'Cancelled'].includes(detail.status) || new Date(detail.endsAt) <= new Date()) {
      throw new ForbiddenException('This class has ended or was cancelled')
    }
    if (!detail.canEnterRoom) {
      throw new ForbiddenException(detail.registered && detail.status === 'Scheduled'
        ? 'The tutor has not started this class yet. Please try again when it is live.'
        : 'Enroll in the course and register for this class to enter the live room')
    }
    const isModerator = this.jaas.isHostRole(user, detail.host?.id || '')
    // Validate configuration and sign BEFORE modifying status or attendance.
    const { roomUrl } = this.jaas.buildParticipantToken(user, id, isModerator)
    if (detail.status === 'Scheduled') {
      await this.prisma.virtualClass.update({ where: { id }, data: { status: 'Live' } })
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

    // Migrate legacy public Jitsi URLs to JaaS when entering
    if (!detail.meetingUrl?.includes('8x8.vc')) {
      await this.prisma.virtualClass.update({
        where: { id },
        data: { meetingUrl: this.jaas.meetingUrlForClass(id) },
      })
    }

    return {
      ...detail,
      status: detail.status === 'Scheduled' ? 'Live' : detail.status,
      meetingUrl: this.jaas.meetingUrlForClass(id),
      roomUrl,
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

    const enrolled=await this.prisma.enrollment.findMany({where:{courseId:virtualClass.courseId},include:{user:{select:{id:true,name:true,email:true}}}})
    const members=new Map(rows.map(r=>[r.userId,r.user]))
    for(const e of enrolled)members.set(e.userId,e.user)
    return {classId:id,title:virtualClass.title,registered:rows.length,entered:rows.filter(r=>r.enteredAt).length,
      attendees:[...members.values()].map(u=>{const r=rows.find(r=>r.userId===u.id);const status=r?.attendanceStatus||(r?.enteredAt?'Present':'Unmarked');return {id:u.id,name:u.name,email:u.email,registeredAt:r?.joinedAt||null,enteredAt:r?.enteredAt||null,attendanceStatus:status,attended:status==='Present'}})}

  }

  async update(id: string, user: AuthUser, dto: UpdateVirtualClassDto) {
    const virtualClass = await this.prisma.virtualClass.findUnique({ where: { id } })
    if (!virtualClass) {
      throw new NotFoundException('Virtual class not found')
    }
    if (user.role !== Role.Admin && virtualClass.hostId !== user.id) {
      throw new ForbiddenException('Only the host or admin can update this class')
    }

    const updated=await this.prisma.$transaction(async tx=>{
      const current=await tx.virtualClass.findUniqueOrThrow({where:{id}})
      const status=dto.status||current.status
      if(!["Cancelled","Completed"].includes(status))await this.checkSlot(tx,current.hostId,new Date(dto.startsAt||current.startsAt),new Date(dto.endsAt||current.endsAt),id)
      else if(new Date(dto.endsAt||current.endsAt)<=new Date(dto.startsAt||current.startsAt))throw new BadRequestException("End time must be after start time.")
      return tx.virtualClass.update({
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
    })
    await this.announceClass(updated.courseId,id,"Class updated",`${updated.title} · ${updated.status}. Check the latest class time and details.`)
    return updated
  }

  async register(id: string, userId: string) {
    const virtualClass = await this.prisma.virtualClass.findUnique({
      where: { id },
      include: { course: true },
    })
    if (!virtualClass || ['Cancelled', 'Completed'].includes(virtualClass.status) || virtualClass.endsAt <= new Date()) {
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
  private async announceClass(courseId:string,id:string,title:string,body:string){
    const students=await this.prisma.enrollment.findMany({where:{courseId},select:{userId:true}})
    await this.notifications.notifyMany(students.map(s=>s.userId),title,body,`/classes/${id}`)
  }

  private async classAccess(id: string, user: AuthUser, manage = false) {
    const detail = await this.findOne(id, user)
    if (manage ? !detail.canManage : !(detail.canManage || detail.enrolled)) {
      throw new ForbiddenException(manage ? 'Only the host or admin can manage this class' : 'Enroll in the course to view class materials')
    }
    return detail
  }

  async remove(id: string, user: AuthUser) {
    const detail = await this.classAccess(id, user, true)
    if (detail.status === 'Live') throw new BadRequestException('Complete or cancel the live class before deleting it')
    await this.prisma.virtualClass.delete({ where: { id } })
    return { ok: true }
  }

  async notes(id: string, user: AuthUser) {
    await this.classAccess(id, user)
    return this.prisma.classNote.findMany({
      where: { classId: id, OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }] },
      include: { author: { select: { name: true } } }, orderBy: { createdAt: 'desc' },
    })
  }

  async addNote(id: string, user: AuthUser, dto: ClassNoteDto) {
    await this.classAccess(id, user, true)
    const expiresAt = dto.expiresAt ? new Date(dto.expiresAt) : null
    if (!dto.body.trim() || (expiresAt && expiresAt <= new Date())) throw new BadRequestException('Write a note and choose an expiry in the future')
    return this.prisma.classNote.create({ data: { classId: id, authorId: user.id, body: dto.body.trim(), expiresAt } })
  }

  async removeNote(id: string, noteId: string, user: AuthUser) {
    await this.classAccess(id, user, true)
    await this.prisma.classNote.deleteMany({ where: { id: noteId, classId: id } })
    return { ok: true }
  }

  async getReminder(id: string, user: AuthUser) {
    await this.classAccess(id, user)
    return this.prisma.classReminder.findUnique({ where: { classId_userId: { classId: id, userId: user.id } } })
  }

  async setReminder(id: string, user: AuthUser, dto: ClassReminderDto) {
    const detail = await this.classAccess(id, user)
    const remindAt = new Date(dto.remindAt)
    if (['Completed', 'Cancelled'].includes(detail.status) || remindAt <= new Date() || remindAt >= new Date(detail.endsAt)) {
      throw new BadRequestException('Choose a reminder in the future before this class ends')
    }
    return this.prisma.classReminder.upsert({
      where: { classId_userId: { classId: id, userId: user.id } },
      create: { classId: id, userId: user.id, remindAt }, update: { remindAt, deliveredAt: null },
    })
  }

  async removeReminder(id: string, user: AuthUser) {
    await this.prisma.classReminder.deleteMany({ where: { classId: id, userId: user.id } })
    return { ok: true }
  }

}
