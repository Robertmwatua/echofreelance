import { ForbiddenException, NotFoundException } from '@nestjs/common'
import { Role } from '@prisma/client'
import { AuthUser } from './current-user.decorator'
import { PrismaService } from '../prisma/prisma.service'

/** Shared course-content authorization, independent of frontend role checks. */
export async function requireCourseAccess(prisma: PrismaService, courseId: string, user?: AuthUser | null) {
  const course = await prisma.course.findUnique({ where: { id: courseId } })
  if (!course) throw new NotFoundException('Course not found')
  const canManage = Boolean(user && (user.role === Role.Admin || user.id === course.tutorId))
  if (!course.published && !canManage) throw new NotFoundException('Course not found')
  if (!user) throw new ForbiddenException('Sign in and enroll to access course materials')
  if (!canManage) {
    const enrollment = await prisma.enrollment.findUnique({ where: { userId_courseId: { userId: user.id, courseId } } })
    if (!enrollment) throw new ForbiddenException('Enroll in the course to access its materials')
  }
  return { course, canManage }
}
