import { feeQuote } from '../payments/fee-policy'
import { programmeRoadmaps, publicProgrammeIds } from './programme-roadmaps'
import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common'
import { Role } from '@prisma/client'
import { AuthUser } from '../../common/current-user.decorator'
import { PrismaService } from '../../prisma/prisma.service'
import { NotificationsService } from '../notifications/notifications.service'
import {
  CreateCourseDto,
  CreateLessonDto,
  UpdateCourseDto,
  UpdateLessonDto,
} from './dto/create-course.dto'

@Injectable()
export class CoursesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notifications: NotificationsService,
  ) {}

  async list(userId?: string, category?: string, q?: string) {
    const courses = await this.prisma.course.findMany({
      where: {
        archived: false,
        AND: [{ OR: [{ published: true }, { publicPreview: true }, { id: { in: publicProgrammeIds }, publicPreview: null }] }],
        ...(category ? { category } : {}),
        ...(q
          ? {
              OR: [
                { title: { contains: q, mode: 'insensitive' } },
                { description: { contains: q, mode: 'insensitive' } },
                { category: { contains: q, mode: 'insensitive' } },
              ],
            }
          : {}),
      },
      include: {
        tutor: { select: { id: true, name: true, email: true, headline: true } },
        _count: { select: { enrollments: true, lessons: {where:{published:true}} } },
        reviews: { select: { rating: true } },
        lessons: { where:{published:true}, select: { durationMinutes: true } },
      },
      orderBy: { createdAt: 'desc' },
    })

    const enrolledIds = userId
      ? new Set(
          (
            await this.prisma.enrollment.findMany({
              where: { userId, courseId: { in: courses.map((c) => c.id) } },
              select: { courseId: true },
            })
          ).map((e) => e.courseId),
        )
      : new Set<string>()

    return courses.map((course) => {
      const mapped = this.mapCourse(course, enrolledIds.has(course.id))
      const ratings = course.reviews.map((r) => r.rating)
      const avgRating =
        ratings.length === 0
          ? null
          : Math.round((ratings.reduce((a, b) => a + b, 0) / ratings.length) * 10) / 10
      return {
        ...mapped,
        avgRating,
        reviewCount: ratings.length,
        durationMinutes: course.lessons.reduce((sum,l) => sum + l.durationMinutes,0),
      }
    })
  }

  async catalogue(query: Record<string, string>) {
    // Include approved programme previews; unrelated private drafts stay private.
    const all = await this.list()
    const normalize = (value: string) => value.trim().replace(/animaion/ig, 'animation').replace(/\s+/g, ' ').toLowerCase()
    const categories: Record<string, number> = Object.create(null)
    for (const c of all) categories[normalize(c.category)] = (categories[normalize(c.category)] || 0) + 1
    let filtered = all.filter(c => (!query.q || normalize(`${c.title} ${c.description} ${c.category}`).includes(normalize(query.q))) && (!query.category || normalize(c.category) === normalize(query.category)) && (!query.level || c.level.toLowerCase() === query.level.toLowerCase()) && (!query.price || (!c.feesPending && (query.price === 'free' ? c.priceCents === 0 : c.priceCents > 0))) && (!query.duration || (c.durationMinutes > 0 && (query.duration === 'short' ? c.durationMinutes < 120 : c.durationMinutes >= 120))))
    filtered.sort((a,b) => query.sort === 'newest' ? (b.createdAt?.getTime() || 0) - (a.createdAt?.getTime() || 0) : query.sort === 'rating' ? (b.avgRating || 0) - (a.avgRating || 0) : query.sort === 'shortest' ? a.durationMinutes - b.durationMinutes : (b.enrollmentCount || 0) - (a.enrollmentCount || 0))
    const offset = Math.max(0, Math.min(100000, Math.floor(Number(query.offset) || 0)))
    const limit = Math.max(1, Math.min(24, Math.floor(Number(query.limit) || 24)))
    return { courses: filtered.slice(offset, offset + limit), total: filtered.length, totalCourses: all.length, categories, hasMore: offset + limit < filtered.length, suggested: [...all].sort((a,b) => (b.enrollmentCount || 0) - (a.enrollmentCount || 0)).slice(0,3) }
  }

  async findOne(id: string, userId?: string, role?: Role) {
    const course = await this.prisma.course.findUnique({
      where: { id },
      include: {
        tutor: { select: { id: true, name: true, email: true, headline: true } },
        lessons: {
          orderBy: { order: 'asc' },
          include: { resources: { orderBy: { createdAt: 'desc' } } },
        },
        _count: { select: { enrollments: true, lessons: true } },
      },
    })
    if (!course) {
      throw new NotFoundException('Course not found')
    }

    const isOwner = userId === course.tutorId
    if (!isOwner && role !== Role.Admin) {course.lessons=course.lessons.filter(l=>l.published);course._count.lessons=course.lessons.length}
    const isStaff = role === Role.Admin || role === Role.Tutor
    const archivedEnrollment = course.archived && userId ? await this.prisma.enrollment.findUnique({ where: { userId_courseId: { userId, courseId: id } } }) : null
    if (!course.published && !isOwner && role !== Role.Admin && !archivedEnrollment && !((course.publicPreview ?? Boolean(programmeRoadmaps[id])) && !course.archived)) {
      throw new NotFoundException('Course not found')
    }

    // A public roadmap does not expose private draft lessons, recordings or progress.
    if (!course.published && !isOwner && role !== Role.Admin && !archivedEnrollment) {
      return { ...this.mapCourse(course, false), lessons: [], sessions: [], canManage: false, isStaff }
    }

    const enrolled = userId
      ? Boolean(
          await this.prisma.enrollment.findUnique({
            where: { userId_courseId: { userId, courseId: id } },
          }),
        )
      : false

    const canSeeLessons = enrolled || isOwner || role === Role.Admin

    let completedIds = new Set<string>()
    if (userId && canSeeLessons) {
      const progress = await this.prisma.lessonProgress.findMany({
        where: {
          userId,
          lessonId: { in: course.lessons.map((l) => l.id) },
        },
        select: { lessonId: true },
      })
      completedIds = new Set(progress.map((p) => p.lessonId))
    }

    const lessons = canSeeLessons
      ? course.lessons.map((l) => ({
          ...l,
          completed: completedIds.has(l.id),
        }))
      : course.lessons.map((l) => ({
          id: l.id,
          title: l.title,
          order: l.order,
          durationMinutes: l.durationMinutes,
          locked: true,
          completed: false,
        }))

    const total = course.lessons.length
    const completedCount = completedIds.size

    const canSeeSessions = enrolled || isOwner || role === Role.Admin
    const sessions = canSeeSessions
      ? await this.prisma.virtualClass.findMany({
          where: { courseId: id, status: { not: 'Cancelled' } },
          orderBy: { startsAt: 'desc' },
          take: 40,
          select: {
            id: true,
            title: true,
            startsAt: true,
            endsAt: true,
            status: true,
            recordingUrl: true,
            _count: { select: { attendances: true } },
          },
        })
      : []

    return {
      ...this.mapCourse(course, enrolled),
      lessons,
      sessions: sessions.map((s) => ({
        id: s.id,
        title: s.title,
        startsAt: s.startsAt,
        endsAt: s.endsAt,
        status: s.status,
        recordingUrl: s.recordingUrl,
        attendanceCount: s._count.attendances,
        hasRecording: Boolean(s.recordingUrl),
      })),
      progress:
        userId && enrolled
          ? {
              total,
              completed: completedCount,
              percent: total === 0 ? 0 : Math.round((completedCount / total) * 100),
            }
          : undefined,
      canManage: isOwner || role === Role.Admin,
      isStaff,
    }
  }

  async listTaughtBy(tutorId: string) {
    const courses = await this.prisma.course.findMany({
      where: { tutorId },
      include: {
        reviews: { select: { rating: true } },
        tutor: { select: { id: true, name: true, email: true } },
        _count: { select: { enrollments: true, lessons: true, virtualClasses: true } },
      },
      orderBy: { updatedAt: 'desc' },
    })
    return courses.map((c) => {
      const ratings = c.reviews.map(r => r.rating)
      return { ...this.mapCourse(c, false), avgRating: ratings.length ? ratings.reduce((a, b) => a + b, 0) / ratings.length : null, reviewCount: ratings.length }
    })
  }

  async listAllAdmin() {
    const courses = await this.prisma.course.findMany({
      include: {
        reviews: { select: { rating: true } },
        tutor: { select: { id: true, name: true, email: true } },
        _count: { select: { enrollments: true, lessons: true } },
      },
      orderBy: { updatedAt: 'desc' },
    })
    return courses.map((c) => {
      const ratings = c.reviews.map(r => r.rating)
      return { ...this.mapCourse(c, false), avgRating: ratings.length ? ratings.reduce((a, b) => a + b, 0) / ratings.length : null, reviewCount: ratings.length }
    })
  }

  async create(tutorId: string, dto: CreateCourseDto) {
    if (dto.published) throw new BadRequestException('Create a draft and add at least one lesson before publishing.')
    return this.prisma.course.create({
      data: {
        title: dto.title,
        description: dto.description,
        category: dto.category ?? 'General',
        level: dto.level ?? 'Beginner',
        priceCents: dto.priceCents ?? 0,
        published: dto.published ?? false,
        tutorId,
        ...(dto.roadmapSteps !== undefined ? { roadmapSteps: dto.roadmapSteps } : {}),
        ...(dto.publicPreview !== undefined ? { publicPreview: dto.publicPreview } : {}),
      },
      include: {
        tutor: { select: { id: true, name: true, email: true } },
      },
    })
  }

  async update(id: string, user: AuthUser, dto: UpdateCourseDto) {
    const course = await this.requireCourse(id)
    this.assertCanManage(course.tutorId, user)
    if (dto.priceCents !== undefined && dto.priceCents !== course.priceCents) throw new ForbiddenException('An administrator must confirm fees using the school fee controls.')
    if (dto.published === true) {
      if (dto.archived ?? course.archived) throw new BadRequestException('Restore this course before publishing.')
      const lessons = await this.prisma.lesson.count({ where: { courseId: id, published:true } })
      if (!lessons) throw new BadRequestException('Add at least one lesson before publishing.')
      if ((dto.description ?? course.description).includes('Fees, duration, intake dates and lesson content are awaiting confirmation.')) throw new BadRequestException('Review the prospectus details and confirm pricing before publishing.')
    }
    return this.prisma.course.update({
      where: { id },
      data: {
        ...(dto.roadmapSteps !== undefined ? { roadmapSteps: dto.roadmapSteps } : {}),
        ...(dto.publicPreview !== undefined ? { publicPreview: dto.publicPreview } : {}),
        ...(dto.archived !== undefined ? { archived: dto.archived, ...(dto.archived ? { published: false } : {}) } : {}),
        ...(dto.title !== undefined ? { title: dto.title } : {}),
        ...(dto.description !== undefined ? { description: dto.description } : {}),
        ...(dto.category !== undefined ? { category: dto.category } : {}),
        ...(dto.level !== undefined ? { level: dto.level } : {}),
        ...(dto.priceCents !== undefined ? { priceCents: dto.priceCents } : {}),
        ...(dto.published !== undefined ? { published: dto.published } : {}),
      },
      include: {
        tutor: { select: { id: true, name: true, email: true } },
        lessons: { orderBy: { order: 'asc' } },
      },
    })
  }

  async duplicate(id: string, user: AuthUser) {
    const source = await this.requireCourse(id)
    this.assertCanManage(source.tutorId, user)
    const lessons = await this.prisma.lesson.findMany({ where: { courseId: id }, orderBy: { order: 'asc' } })
    return this.prisma.course.create({ data: {
      title: `${source.title} (copy)`, description: source.description,
      category: source.category, level: source.level, priceCents: source.priceCents,
      tutorId: user.id, published: false, archived: false, publicPreview: false,
      ...(source.roadmapSteps != null ? { roadmapSteps: source.roadmapSteps } : programmeRoadmaps[id] ? { roadmapSteps: programmeRoadmaps[id].steps } : {}),
      lessons: { create: lessons.map(l => ({ published:false, title: l.title, content: l.content, order: l.order, durationMinutes: l.durationMinutes, videoUrl: l.videoUrl })) },
    } })
  }

  async remove(id: string, user: AuthUser) {
    const course = await this.requireCourse(id)
    this.assertCanManage(course.tutorId, user)
    if (await this.prisma.courseFeeAccount.count({ where: { courseId: id } })) throw new BadRequestException('This course has fee records. Archive it instead to preserve student statements and receipts.')
    await this.prisma.course.delete({ where: { id } })
    return { ok: true }
  }

  async addLesson(courseId: string, user: AuthUser, dto: CreateLessonDto) {
    const course = await this.requireCourse(courseId)
    this.assertCanManage(course.tutorId, user)
    const order =
      dto.order ??
      (await this.prisma.lesson.count({ where: { courseId } }))
    return this.prisma.lesson.create({
      data: {
        courseId,
        title: dto.title,
        content: dto.content,
        order,
        durationMinutes: dto.durationMinutes ?? 30,
        videoUrl: dto.videoUrl,
        published:false,
      },
    })
  }

  async editLesson(courseId:string,lessonId:string,user:AuthUser,dto:UpdateLessonDto) {
    const course=await this.requireCourse(courseId);this.assertCanManage(course.tutorId,user)
    const lesson=await this.prisma.lesson.findFirst({where:{id:lessonId,courseId}})
    if(!lesson)throw new NotFoundException('Lesson not found')
    return this.prisma.lesson.update({where:{id:lessonId},data:{title:dto.title.trim(),content:dto.content,durationMinutes:dto.durationMinutes,videoUrl:dto.videoUrl||null,published:dto.published}})
  }
  async removeLesson(courseId:string,lessonId:string,user:AuthUser){
    const course=await this.requireCourse(courseId);this.assertCanManage(course.tutorId,user)
    return this.prisma.$transaction(async tx=>{const lesson=await tx.lesson.findFirst({where:{id:lessonId,courseId},include:{_count:{select:{progress:true,notes:true,resources:true}}}});if(!lesson)throw new NotFoundException('Lesson not found');if(lesson.published||lesson._count.progress||lesson._count.notes||lesson._count.resources)throw new BadRequestException('Only private drafts without student progress, notes or resource links can be deleted. Unpublish or remove links first; keep teaching records with student activity.');await tx.lesson.delete({where:{id:lessonId}});const remaining=await tx.lesson.findMany({where:{courseId},orderBy:{order:'asc'},select:{id:true}});for(let order=0;order<remaining.length;order++)await tx.lesson.update({where:{id:remaining[order].id},data:{order}});return {ok:true}},{isolationLevel:'Serializable'})
  }
  async reorder(courseId:string,user:AuthUser,ids:string[]) {
    const course=await this.requireCourse(courseId);this.assertCanManage(course.tutorId,user)
    return this.prisma.$transaction(async tx=>{
      const lessons=await tx.lesson.findMany({where:{courseId},select:{id:true}})
      if(ids.length!==lessons.length||new Set(ids).size!==ids.length||lessons.some(l=>!ids.includes(l.id)))throw new BadRequestException('The lesson list changed. Reload before reordering.')
      for(let order=0;order<ids.length;order++)await tx.lesson.update({where:{id:ids[order]},data:{order}})
      return {ok:true}
    },{isolationLevel:'Serializable'})
  }
  async enroll(courseId: string, userId: string) {
    const course = await this.prisma.course.findFirst({
      where: { id: courseId, published: true, archived: false },
    })
    if (!course) {
      throw new NotFoundException('Course not found')
    }

    if (!(await this.prisma.lesson.count({ where: { courseId } }))) {
      throw new BadRequestException('Enrollment is not open yet. Contact admissions about the next intake.')
    }

    const existing = await this.prisma.enrollment.findUnique({
      where: { userId_courseId: { userId, courseId } },
    })
    if (existing) {
      throw new ConflictException('Already enrolled in this course')
    }

    if (!course.feeConfirmed) throw new BadRequestException('The school has not confirmed fees for this course yet.')
    if (feeQuote(course).totalCents > 0) throw new ForbiddenException('Pay your first instalment through M-Pesa to unlock this course.')

    return this.prisma.enrollment.create({
      data: { courseId, userId },
      include: {
        course: { select: { id: true, title: true } },
      },
    })
  }

  async studentPerformance(courseId: string, user: AuthUser) {
    const course = await this.requireCourse(courseId)
    this.assertCanManage(course.tutorId, user)

    const lessons = await this.prisma.lesson.findMany({
      where: { courseId },
      select: { id: true },
    })
    const totalLessons = lessons.length
    const lessonIds = lessons.map((l) => l.id)

    const assignments = await this.prisma.assignment.findMany({
      where: { courseId },
      select: { id: true, title: true, maxPoints: true },
    })

    const enrollments = await this.prisma.enrollment.findMany({
      where: { courseId },
      include: {
        user: { select: { id: true, name: true, email: true } },
      },
      orderBy: { createdAt: 'asc' },
    })

    const sessions = await this.prisma.virtualClass.findMany({
      where: {
        courseId,
        status: { in: ['Scheduled', 'Live', 'Completed'] },
      },
      select: { id: true },
    })
    const sessionIds = sessions.map((s) => s.id)
    const sessionsTotal = sessionIds.length

    const attendanceRows =
      sessionsTotal === 0
        ? []
        : await this.prisma.classAttendance.findMany({
            where: {
              classId: { in: sessionIds },
              enteredAt: { not: null },
            },
            select: { userId: true, classId: true },
          })
    const attendedByUser = new Map<string, Set<string>>()
    for (const row of attendanceRows) {
      const set = attendedByUser.get(row.userId) || new Set<string>()
      set.add(row.classId)
      attendedByUser.set(row.userId, set)
    }

    const students = []
    for (const e of enrollments) {
      const completed = totalLessons
        ? await this.prisma.lessonProgress.count({
            where: { userId: e.userId, lessonId: { in: lessonIds } },
          })
        : 0
      const submissions = await this.prisma.assignmentSubmission.findMany({
        where: {
          userId: e.userId,
          assignmentId: { in: assignments.map((a) => a.id) },
        },
        select: {
          assignmentId: true,
          status: true,
          grade: true,
          submittedAt: true,
        },
      })
      const graded = submissions.filter((s) => s.grade != null)
      const avgGrade =
        graded.length === 0
          ? null
          : Math.round(
              (graded.reduce((sum, s) => sum + (s.grade || 0), 0) / graded.length) * 10,
            ) / 10

      const sessionsAttended = attendedByUser.get(e.userId)?.size || 0

      students.push({
        id: e.user.id,
        name: e.user.name,
        email: e.user.email,
        enrolledAt: e.createdAt,
        lessonsCompleted: completed,
        lessonsTotal: totalLessons,
        progressPercent:
          totalLessons === 0 ? 0 : Math.round((completed / totalLessons) * 100),
        assignmentsSubmitted: submissions.length,
        assignmentsTotal: assignments.length,
        avgGrade,
        sessionsAttended,
        sessionsTotal,
        attendancePercent:
          sessionsTotal === 0 ? null : Math.round((sessionsAttended / sessionsTotal) * 100),
      })
    }

    return {
      courseId,
      title: course.title,
      studentCount: students.length,
      sessionsTotal,
      students,
    }
  }

  async notifyEnrolled(
    courseId: string,
    user: AuthUser,
    dto: { title: string; body: string },
  ) {
    const course = await this.requireCourse(courseId)
    this.assertCanManage(course.tutorId, user)

    const enrolled = await this.prisma.enrollment.findMany({
      where: { courseId },
      select: { userId: true },
    })
    const ids = enrolled.map((e) => e.userId).filter((id) => id !== user.id)
    await this.notifications.notifyMany(
      ids,
      dto.title.trim(),
      dto.body.trim().slice(0, 280),
      `/courses/${courseId}`,
    )
    return { ok: true, notified: ids.length }
  }

  async myCourses(userId: string) {
    const enrollments = await this.prisma.enrollment.findMany({
      where: { userId },
      include: {
        course: {
          include: {
            tutor: { select: { id: true, name: true, email: true } },
            _count: { select: { enrollments: true, lessons: true } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    return enrollments.map((e) => ({
      ...this.mapCourse(e.course, true),
      enrolledAt: e.createdAt,
    }))
  }

  private async requireCourse(id: string) {
    const course = await this.prisma.course.findUnique({ where: { id } })
    if (!course) {
      throw new NotFoundException('Course not found')
    }
    return course
  }

  private assertCanManage(tutorId: string, user: AuthUser) {
    if (user.role === Role.Admin) return
    if (user.role === Role.Tutor && user.id === tutorId) return
    throw new ForbiddenException('Only the course tutor or an admin can manage this course')
  }

  private mapCourse(
    course: {
      id: string
      title: string
      description: string
      category?: string
      level: string
      priceCents: number
      depositPercent?:number
      discountPercent?:number
      discountUntil?:Date|null
      programmeDuration?:string|null
      registrationFeeCents?:number
      certificationFeeCents?:number
      feeConfirmed?: boolean
      published: boolean
      archived?: boolean
      roadmapSteps?: unknown
      publicPreview?: boolean | null
      tutorId: string
      tutor?: { id: string; name: string | null; email: string; headline?: string | null }
      _count?: { enrollments: number; lessons?: number; virtualClasses?: number }
      createdAt?: Date
      updatedAt?: Date
    },
    enrolled: boolean,
  ) {
    return {
      id: course.id,
      title: course.title,
      description: course.description,
      category: course.category ?? 'General',
      level: course.level,
      priceCents: feeQuote(course).totalCents,
      tuitionCents:course.priceCents,
      ...feeQuote(course),
      programmeDuration:course.programmeDuration,
      discountUntil:course.discountUntil,
      registrationFeeCents:course.registrationFeeCents,
      certificationFeeCents:course.certificationFeeCents,
      published: course.published,
      archived: course.archived ?? false,
      tutorId: course.tutorId,
      instructorId: course.tutorId,
      tutor: course.tutor,
      instructor: course.tutor,
      enrollmentCount: course._count?.enrollments,
      lessonCount: course._count?.lessons,
      classCount: course._count?.virtualClasses,
      enrolled,
      createdAt: course.createdAt,
      updatedAt: course.updatedAt,
      roadmap: Array.isArray(course.roadmapSteps) ? course.roadmapSteps.filter((step): step is string => typeof step === 'string') : programmeRoadmaps[course.id]?.steps || [],
      publicPreview: course.publicPreview ?? Boolean(programmeRoadmaps[course.id]),
      roadmapStatus: course.roadmapSteps != null ? 'Tutor-authored learning roadmap' : programmeRoadmaps[course.id] ? 'Proposed learning roadmap' : undefined,
      feeConfirmed: course.feeConfirmed === true,
      currency: 'KES',
      feesPending: course.feeConfirmed !== true,
      enrollmentOpen: course.published && !course.archived && (course._count?.lessons || 0) > 0,
      ...(programmeRoadmaps[course.id]?.description && course.description.includes('Fees, duration, intake dates and lesson content are awaiting confirmation.') ? { description: programmeRoadmaps[course.id].description } : {}),
    }
  }
}
