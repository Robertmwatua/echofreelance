import {BadRequestException,ConflictException,ForbiddenException,Injectable,NotFoundException} from '@nestjs/common'
import {AuthUser} from '../../common/current-user.decorator'
import {PrismaService} from '../../prisma/prisma.service'
import {CampusService} from '../campus/campus.service'
import {NotificationsService} from '../notifications/notifications.service'
import {submissionLimit} from '../../common/submission-limit'
import {AttemptQuizDto,SaveQuizDto} from './learning.dto'
type Question={prompt:string;options:string[];correctIndex:number;explanation:string}
@Injectable()
export class LearningService {
 constructor(private prisma:PrismaService,private campus:CampusService,private notifications:NotificationsService){}
 async access(courseId:string,user:AuthUser,manage=false){
  const course=await this.prisma.course.findUnique({where:{id:courseId}})
  if(!course)throw new NotFoundException('Course not found.')
  const staff=user.role==='Admin'||(user.role==='Tutor'&&course.tutorId===user.id)
  if(manage&&!staff)throw new ForbiddenException('Only this course’s tutor or an admin can manage assessments.')
  if(!staff){const enrolled=await this.prisma.enrollment.findUnique({where:{userId_courseId:{userId:user.id,courseId}}});if(!enrolled||!course.published||course.archived)throw new ForbiddenException('Enroll in this course to view assessments.')}
  return {course,staff}
 }
 async quizzes(courseId:string,user:AuthUser){
  const {staff}=await this.access(courseId,user)
  const quizzes=await this.prisma.lessonQuiz.findMany({where:{lesson:{courseId,...(!staff?{published:true}:{})},...(!staff?{published:true}:{})},include:{lesson:{select:{title:true,order:true}},attempts:{where:{userId:user.id},orderBy:{createdAt:'desc'},take:1}},orderBy:{lesson:{order:'asc'}}})
  const passes=await this.prisma.quizAttempt.findMany({where:{userId:user.id,passed:true,quizId:{in:quizzes.map(q=>q.id)}},distinct:['quizId','revision'],select:{quizId:true,revision:true}})
  return quizzes.map(q=>({id:q.id,lessonId:q.lessonId,lessonTitle:q.lesson.title,title:q.title,passPercent:q.passPercent,requiredForCertificate:q.requiredForCertificate,published:q.published,revision:q.revision,questions:(q.questions as Question[]).map(v=>staff?v:{prompt:v.prompt,options:v.options}),passed:passes.some(a=>a.quizId===q.id&&a.revision===q.revision),lastAttempt:q.attempts.find(a=>a.revision===q.revision)||null}))
 }
 async save(lessonId:string,user:AuthUser,dto:SaveQuizDto){
  const lesson=await this.prisma.lesson.findUnique({where:{id:lessonId}});if(!lesson)throw new NotFoundException('Lesson not found.')
  await this.access(lesson.courseId,user,true)
  if(dto.questions.some(q=>q.correctIndex>=q.options.length||!q.prompt.trim()||!q.explanation.trim()||q.options.some(o=>!o.trim())))throw new BadRequestException('Every question needs answer choices, a valid correct answer and an explanation.')
  if(dto.published&&!lesson.published)throw new BadRequestException('Publish the lesson before publishing its quiz.')
  const questions=dto.questions.map(q=>({prompt:q.prompt.trim(),options:q.options.map(o=>o.trim()),correctIndex:q.correctIndex,explanation:q.explanation.trim()}))
  const existing=await this.prisma.lessonQuiz.findUnique({where:{lessonId}})
  // Only a changed question set or pass mark invalidates previous passes.
  const changed=!!existing&&(JSON.stringify((existing.questions as Question[]).map(q=>({prompt:q.prompt,options:q.options,correctIndex:q.correctIndex,explanation:q.explanation})))!==JSON.stringify(questions)||existing.passPercent!==dto.passPercent)
  const data={title:dto.title.trim(),questions,passPercent:dto.passPercent,requiredForCertificate:dto.requiredForCertificate,published:dto.published}
  const saved=await this.prisma.lessonQuiz.upsert({where:{lessonId},create:{lessonId,...data},update:{...data,...(changed?{revision:{increment:1}}:{})}})
  if(saved.published&&(!existing?.published||changed)){const students=await this.prisma.enrollment.findMany({where:{courseId:lesson.courseId},select:{userId:true}});await this.notifications.notifyMany(students.map(s=>s.userId),'Lesson quiz ready',saved.title,`/courses/${lesson.courseId}#quizzes`)}
  return saved
 }
 async attempt(id:string,user:AuthUser,dto:AttemptQuizDto){
  await submissionLimit(this.prisma,'quiz-attempt',user.id,60)
  const result=await this.prisma.$transaction(async tx=>{
   const quiz=await tx.lessonQuiz.findUnique({where:{id},include:{lesson:{include:{course:true}}}})
   if(!quiz||!quiz.published||!quiz.lesson.published)throw new NotFoundException('Quiz not available.')
   const course=quiz.lesson.course
   const enrolled=await tx.enrollment.findUnique({where:{userId_courseId:{userId:user.id,courseId:course.id}}})
   if(!enrolled||!course.published||course.archived)throw new ForbiddenException('Enroll before attempting this quiz.')
   if(dto.revision!==quiz.revision)throw new ConflictException('This quiz changed. Reload it before trying again.')
   const questions=quiz.questions as Question[]
   if(dto.answers.length!==questions.length||dto.answers.some((a,i)=>a>=questions[i].options.length))throw new BadRequestException('Answer every question using one of its choices.')
   const score=Math.round(questions.filter((q,i)=>q.correctIndex===dto.answers[i]).length/questions.length*100)
   const attempt=await tx.quizAttempt.create({data:{quizId:id,userId:user.id,revision:quiz.revision,answers:dto.answers,score,passed:score>=quiz.passPercent}})
   return {...attempt,courseId:course.id,results:questions.map((q,i)=>({prompt:q.prompt,correct:dto.answers[i]===q.correctIndex,correctAnswer:q.options[q.correctIndex],explanation:q.explanation}))}
  },{isolationLevel:'Serializable'})
  const certificate=result.passed?await this.campus.issueCertificateIfEligible(user.id,result.courseId):null
  return {...result,certificate}
 }
 async markAttendance(classId:string,userId:string,user:AuthUser,status:string){
  const c=await this.prisma.virtualClass.findUnique({where:{id:classId}})
  if(!c)throw new NotFoundException('Class not found.')
  if(user.role!=='Admin'&&c.hostId!==user.id)throw new ForbiddenException('Only this class’s host or an admin can mark attendance.')
  if(c.status==='Cancelled'||c.startsAt>new Date())throw new BadRequestException('Attendance can be marked once the class starts. Cancelled classes have no attendance.')
  const enrollment=await this.prisma.enrollment.findUnique({where:{userId_courseId:{userId,courseId:c.courseId}}})
  if(!enrollment)throw new BadRequestException('This person is not enrolled in the course.')
  return this.prisma.classAttendance.upsert({where:{classId_userId:{classId,userId}},create:{classId,userId,attendanceStatus:status==='Unmarked'?null:status,markedAt:status==='Unmarked'?null:new Date()},update:{attendanceStatus:status==='Unmarked'?null:status,markedAt:status==='Unmarked'?null:new Date()}})
 }
 async attendance(user:AuthUser){
  const enrollments=await this.prisma.enrollment.findMany({where:{userId:user.id},select:{courseId:true,createdAt:true}})
  const rows=await this.prisma.virtualClass.findMany({where:{OR:enrollments.map(e=>({courseId:e.courseId,startsAt:{gte:e.createdAt}})),status:{not:'Cancelled'}},include:{course:{select:{title:true}},attendances:{where:{userId:user.id}}},orderBy:{startsAt:'desc'},take:200})
  return rows.map(c=>{const a=c.attendances[0];return {id:c.id,title:c.title,courseTitle:c.course.title,startsAt:c.startsAt,status:a?.attendanceStatus||(a?.enteredAt?'Present':c.endsAt<new Date()?'Not recorded':'Upcoming'),enteredAt:a?.enteredAt||null}})
 }
}
