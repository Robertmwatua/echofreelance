import { ForbiddenException, NotFoundException } from '@nestjs/common'
import { Role } from '@prisma/client'
import { AuthUser } from './current-user.decorator'
import { PrismaService } from '../prisma/prisma.service'
export async function accessibleLesson(prisma:PrismaService,id:string,user:AuthUser) {
 const lesson=await prisma.lesson.findUnique({where:{id},include:{course:true}})
 if(!lesson)throw new NotFoundException('Lesson not found')
 const manage=user.role===Role.Admin||(user.role===Role.Tutor&&lesson.course.tutorId===user.id)
 if(!manage){const enrolled=await prisma.enrollment.findUnique({where:{userId_courseId:{userId:user.id,courseId:lesson.courseId}}});if(!enrolled||!lesson.published||(!lesson.course.published&&!lesson.course.archived))throw new ForbiddenException('This lesson is not available to your account.')}
 return lesson
}
