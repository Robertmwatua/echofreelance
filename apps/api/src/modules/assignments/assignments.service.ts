import {CampusService} from '../campus/campus.service'
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
  CreateAssignmentDto,
  GradeSubmissionDto,
  SubmitAssignmentDto,
} from './dto/assignment.dto'

@Injectable()
export class AssignmentsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notifications: NotificationsService,
    private readonly campus: CampusService,
  ) {}

  async listForCourse(courseId: string, user?: AuthUser | null) {
    const course=await this.prisma.course.findUnique({where:{id:courseId}})
    if(!course)throw new NotFoundException('Course not found')
    const staff=user?.role===Role.Admin||(user?.role===Role.Tutor&&course.tutorId===user.id)
    // Assessment instructions and submissions are for enrolled learners and their teacher.
    if(!staff){if(!user||!course.published)return [];const enrollment=await this.prisma.enrollment.findUnique({where:{userId_courseId:{userId:user.id,courseId}}});if(!enrollment)return []}
    const assignments = await this.prisma.assignment.findMany({
      where: {
        courseId,
        ...(staff
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
      requiredForCertificate:a.requiredForCertificate,
      passPercent:a.passPercent,
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
    const assignment=await this.prisma.assignment.create({
      data: {
        courseId: dto.courseId,
        authorId: user.id,
        title: dto.title,
        instructions: dto.instructions,
        dueAt: dto.dueAt ? new Date(dto.dueAt) : null,
        maxPoints: dto.maxPoints ?? 100,
        requiredForCertificate:dto.requiredForCertificate??false,
        passPercent:dto.passPercent??50,
      },
    })
    const students=await this.prisma.enrollment.findMany({where:{courseId:dto.courseId},select:{userId:true}})
    await this.notifications.notifyMany(students.map(s=>s.userId),"New assignment",dto.title,`/courses/${dto.courseId}#assignments`)
    return assignment
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

    const result=await this.prisma.assignmentSubmission.upsert({
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
    const course=await this.prisma.course.findUnique({where:{id:assignment.courseId}})
    if(course)await this.notifications.notify(course.tutorId,"Work submitted",`${user.name||"A student"} submitted ${assignment.title}.`,`/tutor/assignments/${assignmentId}`)
    return result
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
        assignment:{select:{title:true,maxPoints:true,courseId:true,passPercent:true,requiredForCertificate:true}},
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
    if(dto.grade>submission.assignment.maxPoints)throw new BadRequestException(`Grade cannot exceed ${submission.assignment.maxPoints} points.`)
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

    await this.campus.issueCertificateIfEligible(submission.userId,submission.assignment.courseId)
    return graded
  }
}
