import { accessibleLesson } from '../../common/lesson-access'
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
    const lesson=await accessibleLesson(this.prisma,lessonId,user)
    const enrolled=await this.prisma.enrollment.findUnique({where:{userId_courseId:{userId:user.id,courseId:lesson.courseId}}})
    const progress = await this.prisma.lessonProgress.upsert({
      where: { userId_lessonId: { userId: user.id, lessonId } },
      create: { userId: user.id, lessonId },
      update: { completedAt: new Date() },
    })

    const certificate = enrolled ? await this.campus.issueCertificateIfEligible(
      user.id,
      lesson.courseId,
    ) : null

    return { ...progress, certificate }
  }

  async courseProgress(courseId: string, userId: string) {
    const total = await this.prisma.lesson.count({ where: { courseId,published:true } })
    const lessons = await this.prisma.lesson.findMany({
      where: { courseId,published:true },
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
            _count: { select: { lessons: {where:{published:true}} } },
            lessons: { where:{published:true}, select: { id: true } },
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
