import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common'
import { Role } from '@prisma/client'
import { AuthUser } from '../../common/current-user.decorator'
import { PrismaService } from '../../prisma/prisma.service'
import { NotificationsService } from '../notifications/notifications.service'
import {
  CreateAssignmentDto,
  GradeSubmissionDto,
  SubmitAssignmentDto,
} from './dto/assignment.dto'

@Injectable()
export class AssignmentsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notifications: NotificationsService,
  ) {}

  async listForCourse(courseId: string, user?: AuthUser | null) {
    const assignments = await this.prisma.assignment.findMany({
      where: {
        courseId,
        ...(user?.role === Role.Tutor || user?.role === Role.Admin
          ? {}
          : { published: true }),
      },
      include: {
        _count: { select: { submissions: true } },
        submissions: user
          ? { where: { userId: user.id }, take: 1 }
          : false,
      },
      orderBy: { createdAt: 'desc' },
    })

    return assignments.map((a) => ({
      id: a.id,
      courseId: a.courseId,
      title: a.title,
      instructions: a.instructions,
      dueAt: a.dueAt,
      maxPoints: a.maxPoints,
      published: a.published,
      submissionCount: a._count.submissions,
      mySubmission: user && Array.isArray(a.submissions) ? a.submissions[0] || null : null,
    }))
  }

  async create(user: AuthUser, dto: CreateAssignmentDto) {
    const course = await this.prisma.course.findUnique({ where: { id: dto.courseId } })
    if (!course) throw new NotFoundException('Course not found')
    if (user.role !== Role.Admin && course.tutorId !== user.id) {
      throw new ForbiddenException('Only the course tutor can add assignments')
    }
    return this.prisma.assignment.create({
      data: {
        courseId: dto.courseId,
        authorId: user.id,
        title: dto.title,
        instructions: dto.instructions,
        dueAt: dto.dueAt ? new Date(dto.dueAt) : null,
        maxPoints: dto.maxPoints ?? 100,
      },
    })
  }

  async submit(assignmentId: string, user: AuthUser, dto: SubmitAssignmentDto) {
    const assignment = await this.prisma.assignment.findUnique({
      where: { id: assignmentId },
    })
    if (!assignment || !assignment.published) {
      throw new NotFoundException('Assignment not found')
    }
    const enrolled = await this.prisma.enrollment.findUnique({
      where: {
        userId_courseId: { userId: user.id, courseId: assignment.courseId },
      },
    })
    if (!enrolled) {
      throw new ForbiddenException('Enroll in the course before submitting')
    }

    return this.prisma.assignmentSubmission.upsert({
      where: {
        assignmentId_userId: { assignmentId, userId: user.id },
      },
      create: {
        assignmentId,
        userId: user.id,
        content: dto.content,
        linkUrl: dto.linkUrl,
        status: 'Pending',
      },
      update: {
        content: dto.content,
        linkUrl: dto.linkUrl,
        status: 'Pending',
        grade: null,
        feedback: null,
        gradedAt: null,
        submittedAt: new Date(),
      },
    })
  }

  async listSubmissions(assignmentId: string, user: AuthUser) {
    const assignment = await this.prisma.assignment.findUnique({
      where: { id: assignmentId },
      include: { course: true },
    })
    if (!assignment) throw new NotFoundException('Assignment not found')
    if (user.role !== Role.Admin && assignment.course.tutorId !== user.id) {
      throw new ForbiddenException('Only the tutor can view all submissions')
    }
    return this.prisma.assignmentSubmission.findMany({
      where: { assignmentId },
      include: {
        user: { select: { id: true, name: true, email: true } },
      },
      orderBy: { submittedAt: 'desc' },
    })
  }

  async grade(submissionId: string, user: AuthUser, dto: GradeSubmissionDto) {
    const submission = await this.prisma.assignmentSubmission.findUnique({
      where: { id: submissionId },
      include: { assignment: { include: { course: true } } },
    })
    if (!submission) throw new NotFoundException('Submission not found')
    if (
      user.role !== Role.Admin &&
      submission.assignment.course.tutorId !== user.id
    ) {
      throw new ForbiddenException('Only the tutor can grade')
    }
    const graded = await this.prisma.assignmentSubmission.update({
      where: { id: submissionId },
      data: {
        grade: dto.grade,
        feedback: dto.feedback,
        status: 'Graded',
        gradedAt: new Date(),
      },
    })

    await this.notifications.notify(
      submission.userId,
      'Assignment graded',
      `"${submission.assignment.title}" scored ${dto.grade}/${submission.assignment.maxPoints}`,
      `/courses/${submission.assignment.courseId}`,
    )

    return graded
  }
}
