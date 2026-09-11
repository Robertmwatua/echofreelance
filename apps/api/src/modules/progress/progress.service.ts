import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common'
import { Role } from '@prisma/client'
import { AuthUser } from '../../common/current-user.decorator'
import { PrismaService } from '../../prisma/prisma.service'
import { CampusService } from '../campus/campus.service'

@Injectable()
export class ProgressService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly campus: CampusService,
  ) {}

  async completeLesson(lessonId: string, user: AuthUser) {
    const lesson = await this.prisma.lesson.findUnique({
      where: { id: lessonId },
      include: { course: true },
    })
    if (!lesson) {
      throw new NotFoundException('Lesson not found')
    }

    const enrolled = await this.prisma.enrollment.findUnique({
      where: {
        userId_courseId: { userId: user.id, courseId: lesson.courseId },
      },
    })
    if (!enrolled && user.role === Role.Student) {
      throw new ForbiddenException('Enroll in the course first')
    }

    const progress = await this.prisma.lessonProgress.upsert({
      where: { userId_lessonId: { userId: user.id, lessonId } },
      create: { userId: user.id, lessonId },
      update: { completedAt: new Date() },
    })

    const certificate = await this.campus.issueCertificateIfEligible(
      user.id,
      lesson.courseId,
    )

    return { ...progress, certificate }
  }

  async courseProgress(courseId: string, userId: string) {
    const total = await this.prisma.lesson.count({ where: { courseId } })
    const lessons = await this.prisma.lesson.findMany({
      where: { courseId },
      select: { id: true },
    })
    const completed = await this.prisma.lessonProgress.count({
      where: {
        userId,
        lessonId: { in: lessons.map((l) => l.id) },
      },
    })
    const percent = total === 0 ? 0 : Math.round((completed / total) * 100)
    return { courseId, total, completed, percent }
  }

  async myOverview(userId: string) {
    const enrollments = await this.prisma.enrollment.findMany({
      where: { userId },
      include: {
        course: {
          include: {
            _count: { select: { lessons: true } },
            lessons: { select: { id: true } },
          },
        },
      },
    })

    const result = []
    for (const e of enrollments) {
      const completed = await this.prisma.lessonProgress.count({
        where: {
          userId,
          lessonId: { in: e.course.lessons.map((l) => l.id) },
        },
      })
      const total = e.course._count.lessons
      result.push({
        courseId: e.course.id,
        title: e.course.title,
        category: e.course.category,
        total,
        completed,
        percent: total === 0 ? 0 : Math.round((completed / total) * 100),
      })
    }
    return result
  }
}
