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

  async myOverview(userId:string){
    const enrollments=await this.prisma.enrollment.findMany({where:{userId},include:{course:{include:{lessons:{where:{published:true},orderBy:{order:'asc'},select:{id:true,title:true,progress:{where:{userId},select:{completedAt:true}}}}}}}})
    return enrollments.map(e=>{const lessons=e.course.lessons,total=lessons.length,completed=lessons.filter(l=>l.progress.length).length,next=lessons.find(l=>!l.progress.length),last=lessons.filter(l=>l.progress.length).sort((a,b)=>b.progress[0].completedAt.getTime()-a.progress[0].completedAt.getTime())[0];return {courseId:e.course.id,title:e.course.title,category:e.course.category,total,completed,percent:total?Math.round(completed/total*100):0,nextLesson:next?{id:next.id,title:next.title}:null,lastCompletedAt:last?.progress[0].completedAt||null,lastLessonTitle:last?.title||null}}).sort((a,b)=>new Date(b.lastCompletedAt||0).getTime()-new Date(a.lastCompletedAt||0).getTime())
  }
}
