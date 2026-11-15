import { BadRequestException, ConflictException, HttpException, Injectable, NotFoundException } from '@nestjs/common'
import { createHash } from 'crypto'
import { PrismaService } from '../../prisma/prisma.service'
import { publicProgrammeIds } from '../courses/programme-roadmaps'
import { ApplyJobDto, EnquiryDto, JobDto, ReviewApplicationDto, ReviewEnquiryDto, TaskDto } from './school.dto'

@Injectable()
export class SchoolService {
  constructor(private readonly prisma: PrismaService) {}
  private async limit(scope:string,identity:string,max:number) {
    const hour=Math.floor(Date.now()/3600000)
    const bucket=createHash('sha256').update(`${scope}:${identity}:${hour}`).digest('hex')
    const record=await this.prisma.submissionLimit.upsert({where:{bucket},create:{bucket,expiresAt:new Date((hour+2)*3600000)},update:{count:{increment:1}}})
    if(record.count>max)throw new HttpException('Too many submissions. Please try again in an hour.',429)
    await this.prisma.submissionLimit.deleteMany({where:{expiresAt:{lt:new Date()}}})
  }
  async enquire(dto:EnquiryDto,ip:string) {
    if(dto.name.trim().length<2||dto.message.trim().length<10)throw new BadRequestException('Please include your name and a specific question.')
    await this.limit('admissions-ip',ip,30)
    const email=dto.email.trim().toLowerCase()
    await this.limit('admissions-email',email,3)
    if(dto.courseId) {
      const course=await this.prisma.course.findFirst({where:{id:dto.courseId,archived:false,OR:[{published:true},{publicPreview:true},{id:{in:publicProgrammeIds},publicPreview:null}]}})
      if(!course)throw new BadRequestException('Choose a public course, or send a general enquiry.')
    }
    const enquiry=await this.prisma.admissionEnquiry.create({data:{name:dto.name.trim(),email,phone:dto.phone?.trim()||null,message:dto.message.trim(),courseId:dto.courseId||null}})
    return {id:enquiry.id,message:'Your enquiry is with admissions. The school will contact you using the details you provided.'}
  }
  async enquiries(offset:number,status?:string) {
    const where=status&&['New','Contacted','Closed'].includes(status)?{status}:{}
    const [items,total]=await Promise.all([this.prisma.admissionEnquiry.findMany({where,skip:offset,take:30,orderBy:{createdAt:'desc'},include:{course:{select:{id:true,title:true}}}}),this.prisma.admissionEnquiry.count({where})]);return {items,total}
  }
  async reviewEnquiry(id:string,dto:ReviewEnquiryDto){if(!await this.prisma.admissionEnquiry.findUnique({where:{id}}))throw new NotFoundException();return this.prisma.admissionEnquiry.update({where:{id},data:dto})}
  async jobs(admin=false) {
    if(admin)return this.prisma.jobPosting.findMany({orderBy:{createdAt:'desc'},take:100,include:{_count:{select:{applications:true}}}})
    return this.prisma.jobPosting.findMany({where:{published:true,OR:[{deadline:null},{deadline:{gt:new Date()}}]},orderBy:{createdAt:'desc'},take:100,select:{id:true,title:true,company:true,location:true,kind:true,description:true,deadline:true,createdAt:true}})
  }
  async job(id:string) {
    const job=await this.prisma.jobPosting.findFirst({where:{id,published:true},select:{id:true,title:true,company:true,location:true,kind:true,description:true,deadline:true,createdAt:true}})
    if(!job)throw new NotFoundException('This vacancy is not available.')
    return {...job,open:!job.deadline||job.deadline.getTime()>Date.now()}
  }
  async saveJob(userId:string,dto:JobDto,id?:string) {
    if(dto.title.trim().length<3||dto.description.trim().length<30)throw new BadRequestException('Add a clear role title and description.')
    if(dto.published&&dto.deadline&&new Date(dto.deadline).getTime()<=Date.now())throw new BadRequestException('Choose a future closing date before publishing.')
    if(id&&!await this.prisma.jobPosting.findUnique({where:{id}}))throw new NotFoundException()
    const data={title:dto.title.trim(),company:dto.company.trim(),location:dto.location.trim(),kind:dto.kind,description:dto.description.trim(),deadline:dto.deadline?new Date(dto.deadline):null,published:dto.published}
    return id?this.prisma.jobPosting.update({where:{id},data}):this.prisma.jobPosting.create({data:{...data,createdById:userId}})
  }
  async apply(id:string,userId:string,dto:ApplyJobDto) {
    if(dto.coverLetter.trim().length<30)throw new BadRequestException('Tell the school why you are applying in at least 30 characters.')
    await this.limit('application-user',userId,10)
    try {
      return await this.prisma.$transaction(async tx=>{
        const job=await tx.jobPosting.findUnique({where:{id}})
        if(!job||!job.published||(job.deadline&&job.deadline.getTime()<=Date.now()))throw new BadRequestException('Applications are closed for this role.')
        const item=await tx.jobApplication.create({data:{jobId:id,userId,coverLetter:dto.coverLetter.trim(),resumeUrl:dto.resumeUrl,portfolioUrl:dto.portfolioUrl||null}})
        return {id:item.id,status:item.status}
      },{isolationLevel:'Serializable'})
    }catch(e){if((e as {code?:string}).code==='P2002')throw new ConflictException('You have already applied for this role.');if((e as {code?:string}).code==='P2034')throw new ConflictException('This vacancy changed while you applied. Refresh and try again.');throw e}
  }
  async myApplications(userId:string){return this.prisma.jobApplication.findMany({where:{userId},orderBy:{createdAt:'desc'},select:{id:true,status:true,createdAt:true,job:{select:{id:true,title:true,company:true}}}})}
  async applications(offset:number,jobId?:string){const where=jobId?{jobId}:{};const [items,total]=await Promise.all([this.prisma.jobApplication.findMany({where,skip:offset,take:30,orderBy:{createdAt:'desc'},include:{user:{select:{name:true,email:true}},job:{select:{id:true,title:true,company:true}}}}),this.prisma.jobApplication.count({where})]);return {items,total}}
  async reviewApplication(id:string,dto:ReviewApplicationDto){if(!await this.prisma.jobApplication.findUnique({where:{id}}))throw new NotFoundException();return this.prisma.jobApplication.update({where:{id},data:dto})}
  async assignedTasks(userId:string){return this.prisma.schoolTask.findMany({where:{assigneeId:userId,done:false},orderBy:{dueAt:'asc'},take:30})}
  async assignedDone(id:string,userId:string){const task=await this.prisma.schoolTask.findFirst({where:{id,assigneeId:userId}});if(!task)throw new NotFoundException();return this.prisma.schoolTask.update({where:{id},data:{done:true}})}
  async tasks(){return this.prisma.schoolTask.findMany({orderBy:[{done:'asc'},{dueAt:'asc'}],take:100,include:{assignee:{select:{id:true,name:true,email:true}},createdBy:{select:{name:true}}}})}
  async saveTask(userId:string,dto:TaskDto,id?:string){
    if(dto.title.trim().length<3)throw new BadRequestException('Add a clear task title.')
    const dueAt=new Date(dto.dueAt)
    if(Math.abs(dueAt.getTime()-Date.now())>366*86400000)throw new BadRequestException('Choose a task date within a year of today.')
    if(dto.assigneeId&&!await this.prisma.user.findFirst({where:{id:dto.assigneeId,role:{in:['Admin','Tutor']}}}))throw new BadRequestException('Assign tasks to a current tutor or admin.')
    if(id&&!await this.prisma.schoolTask.findUnique({where:{id}}))throw new NotFoundException()
    const data={title:dto.title.trim(),details:dto.details.trim(),dueAt,assigneeId:dto.assigneeId||null}
    return id?this.prisma.schoolTask.update({where:{id},data}):this.prisma.schoolTask.create({data:{...data,createdById:userId}})
  }
  async taskDone(id:string,done:boolean){if(!await this.prisma.schoolTask.findUnique({where:{id}}))throw new NotFoundException();return this.prisma.schoolTask.update({where:{id},data:{done}})}
  async agenda(){const now=new Date(),end=new Date(Date.now()+30*86400000);const [classes,assignments,newEnquiries,newApplications,tasks]=await Promise.all([
    this.prisma.virtualClass.findMany({where:{endsAt:{gte:now},startsAt:{lte:end},status:{in:['Live','Scheduled']}},orderBy:{startsAt:'asc'},take:50,include:{host:{select:{name:true}},course:{select:{title:true}}}}),
    this.prisma.assignment.findMany({where:{published:true,dueAt:{gte:now,lte:end}},orderBy:{dueAt:'asc'},take:50,select:{id:true,title:true,courseId:true,dueAt:true}}),
    this.prisma.admissionEnquiry.count({where:{status:'New'}}),this.prisma.jobApplication.count({where:{status:'Received'}}),this.tasks()]);return {classes:classes.map(c=>({id:c.id,title:c.title,startsAt:c.startsAt,endsAt:c.endsAt,status:c.status,host:c.host,course:c.course})),assignments,newEnquiries,newApplications,tasks}}
}
