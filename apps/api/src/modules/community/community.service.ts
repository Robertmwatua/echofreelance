import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common'
import { Role } from '@prisma/client'
import { AuthUser } from '../../common/current-user.decorator'
import { PrismaService } from '../../prisma/prisma.service'
import { CreateDiscussionDto, UpsertNoteDto } from './dto/community.dto'

@Injectable()
export class CommunityService {
  constructor(private readonly prisma: PrismaService) {}

  async listDiscussions(courseId: string) {
    const course = await this.prisma.course.findUnique({ where: { id: courseId } })
    if (!course) throw new NotFoundException('Course not found')

    return this.prisma.discussionPost.findMany({
      where: { courseId },
      include: {
        author: { select: { id: true, name: true, role: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 100,
    })
  }

  async createDiscussion(courseId: string, user: AuthUser, dto: CreateDiscussionDto) {
    const course = await this.prisma.course.findUnique({ where: { id: courseId } })
    if (!course) throw new NotFoundException('Course not found')

    const enrolled = await this.prisma.enrollment.findUnique({
      where: { userId_courseId: { userId: user.id, courseId } },
    })
    const canPost =
      enrolled ||
      course.tutorId === user.id ||
      user.role === Role.Admin
    if (!canPost) {
      throw new ForbiddenException('Enroll in the course to join the discussion')
    }

    return this.prisma.discussionPost.create({
      data: {
        courseId,
        authorId: user.id,
        body: dto.body.trim(),
      },
      include: {
        author: { select: { id: true, name: true, role: true } },
      },
    })
  }

  async myNotes(userId: string) {
    return this.prisma.lessonNote.findMany({
      where: { userId },
      include: {
        lesson: {
          select: {
            id: true,
            title: true,
            courseId: true,
            course: { select: { id: true, title: true } },
          },
        },
      },
      orderBy: { updatedAt: 'desc' },
    })
  }

  async getNote(lessonId: string, userId: string) {
    return this.prisma.lessonNote.findUnique({
      where: { userId_lessonId: { userId, lessonId } },
    })
  }

  async upsertNote(lessonId: string, user: AuthUser, dto: UpsertNoteDto) {
    const lesson = await this.prisma.lesson.findUnique({
      where: { id: lessonId },
      include: { course: true },
    })
    if (!lesson) throw new NotFoundException('Lesson not found')

    const enrolled = await this.prisma.enrollment.findUnique({
      where: {
        userId_courseId: { userId: user.id, courseId: lesson.courseId },
      },
    })
    if (
      !enrolled &&
      lesson.course.tutorId !== user.id &&
      user.role !== Role.Admin
    ) {
      throw new ForbiddenException('Enroll to save notes for this lesson')
    }

    return this.prisma.lessonNote.upsert({
      where: { userId_lessonId: { userId: user.id, lessonId } },
      create: {
        userId: user.id,
        lessonId,
        body: dto.body,
      },
      update: { body: dto.body },
    })
  }
}
