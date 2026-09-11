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
  CreateAnnouncementDto,
  CreateResourceDto,
  CreateReviewDto,
} from './dto/campus.dto'

@Injectable()
export class CampusService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notifications: NotificationsService,
  ) {}

  async listReviews(courseId: string) {
    const reviews = await this.prisma.courseReview.findMany({
      where: { courseId },
      include: { user: { select: { id: true, name: true } } },
      orderBy: { createdAt: 'desc' },
    })
    const avg =
      reviews.length === 0
        ? 0
        : Math.round(
            (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length) * 10,
          ) / 10
    return { average: avg, count: reviews.length, reviews }
  }

  async upsertReview(courseId: string, user: AuthUser, dto: CreateReviewDto) {
    const enrolled = await this.prisma.enrollment.findUnique({
      where: { userId_courseId: { userId: user.id, courseId } },
    })
    if (!enrolled) {
      throw new ForbiddenException('Enroll before reviewing')
    }
    const course = await this.prisma.course.findUnique({ where: { id: courseId } })
    if (!course) throw new NotFoundException('Course not found')

    const review = await this.prisma.courseReview.upsert({
      where: { courseId_userId: { courseId, userId: user.id } },
      create: {
        courseId,
        userId: user.id,
        rating: dto.rating,
        comment: dto.comment?.trim() || null,
      },
      update: {
        rating: dto.rating,
        comment: dto.comment?.trim() || null,
      },
    })

    await this.notifications.notify(
      course.tutorId,
      'New course review',
      `${user.name || 'A student'} rated “${course.title}” ${dto.rating}/5`,
      `/courses/${courseId}`,
    )

    return review
  }

  async addResource(user: AuthUser, dto: CreateResourceDto) {
    const lesson = await this.prisma.lesson.findUnique({
      where: { id: dto.lessonId },
      include: { course: true },
    })
    if (!lesson) throw new NotFoundException('Lesson not found')
    if (user.role !== Role.Admin && lesson.course.tutorId !== user.id) {
      throw new ForbiddenException('Only the course tutor can add resources')
    }
    return this.prisma.lessonResource.create({
      data: {
        lessonId: dto.lessonId,
        authorId: user.id,
        title: dto.title,
        url: dto.url,
        kind: dto.kind || 'link',
      },
    })
  }

  async listResources(lessonId: string) {
    return this.prisma.lessonResource.findMany({
      where: { lessonId },
      orderBy: { createdAt: 'desc' },
    })
  }

  async createAnnouncement(user: AuthUser, dto: CreateAnnouncementDto) {
    const course = await this.prisma.course.findUnique({ where: { id: dto.courseId } })
    if (!course) throw new NotFoundException('Course not found')
    if (user.role !== Role.Admin && course.tutorId !== user.id) {
      throw new ForbiddenException('Only the course tutor can post announcements')
    }

    const announcement = await this.prisma.courseAnnouncement.create({
      data: {
        courseId: dto.courseId,
        authorId: user.id,
        title: dto.title,
        body: dto.body,
      },
    })

    const enrolled = await this.prisma.enrollment.findMany({
      where: { courseId: dto.courseId },
      select: { userId: true },
    })
    await this.notifications.notifyMany(
      enrolled.map((e) => e.userId),
      `Announcement: ${dto.title}`,
      dto.body.slice(0, 180),
      `/courses/${dto.courseId}`,
    )

    return announcement
  }

  async listAnnouncements(courseId: string) {
    return this.prisma.courseAnnouncement.findMany({
      where: { courseId },
      include: { author: { select: { id: true, name: true } } },
      orderBy: { createdAt: 'desc' },
      take: 20,
    })
  }

  async issueCertificateIfEligible(userId: string, courseId: string) {
    const total = await this.prisma.lesson.count({ where: { courseId } })
    if (total === 0) return null
    const lessons = await this.prisma.lesson.findMany({
      where: { courseId },
      select: { id: true },
    })
    const completed = await this.prisma.lessonProgress.count({
      where: { userId, lessonId: { in: lessons.map((l) => l.id) } },
    })
    if (completed < total) return null

    const existing = await this.prisma.certificate.findUnique({
      where: { userId_courseId: { userId, courseId } },
    })
    if (existing) return existing

    const course = await this.prisma.course.findUnique({ where: { id: courseId } })
    if (!course) return null

    const code = `EF-${courseId.slice(-4).toUpperCase()}-${userId.slice(-4).toUpperCase()}-${Date.now().toString(36).toUpperCase()}`
    const cert = await this.prisma.certificate.create({
      data: { code, userId, courseId },
      include: {
        course: { select: { id: true, title: true } },
        user: { select: { id: true, name: true, email: true } },
      },
    })

    await this.notifications.notify(
      userId,
      'Certificate earned',
      `You completed “${course.title}”. View your certificate.`,
      `/certificates/${cert.code}`,
    )

    return cert
  }

  async myCertificates(userId: string) {
    return this.prisma.certificate.findMany({
      where: { userId },
      include: {
        course: { select: { id: true, title: true, category: true } },
      },
      orderBy: { issuedAt: 'desc' },
    })
  }

  async getCertificate(code: string) {
    const cert = await this.prisma.certificate.findUnique({
      where: { code },
      include: {
        course: { select: { id: true, title: true, category: true, level: true } },
        user: { select: { id: true, name: true, email: true } },
      },
    })
    if (!cert) throw new NotFoundException('Certificate not found')
    return cert
  }

  async claimCertificate(courseId: string, user: AuthUser) {
    const enrolled = await this.prisma.enrollment.findUnique({
      where: { userId_courseId: { userId: user.id, courseId } },
    })
    if (!enrolled) throw new ForbiddenException('Not enrolled')
    const cert = await this.issueCertificateIfEligible(user.id, courseId)
    if (!cert) {
      throw new BadRequestException('Finish all lessons to earn a certificate')
    }
    return cert
  }
}
