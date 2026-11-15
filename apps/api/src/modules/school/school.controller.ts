import { Body, Controller, Get, Param, Patch, Post, Query, Req, UseGuards } from '@nestjs/common'
import { Role } from '@prisma/client'
import { AuthUser, CurrentUser } from '../../common/current-user.decorator'
import { Roles } from '../../common/roles.decorator'
import { RolesGuard } from '../../common/roles.guard'
import { JwtAuthGuard } from '../auth/jwt-auth.guard'
import { ApplyJobDto, EnquiryDto, JobDto, ReviewApplicationDto, ReviewEnquiryDto, TaskDto, TaskStatusDto } from './school.dto'
import { SchoolService } from './school.service'
const page=(value?:string)=>Math.max(0,Math.min(100000,Math.floor(Number(value)||0)))
@Controller('school')
export class SchoolPublicController {
 constructor(private readonly service:SchoolService){}
 @Post('enquiries') enquire(@Body() dto:EnquiryDto,@Req() req:{ip?:string}){return this.service.enquire(dto,req.ip||'unknown')}
 @Get('jobs') jobs(){return this.service.jobs()}
 @Get('jobs/:id') job(@Param('id') id:string){return this.service.job(id)}
 @UseGuards(JwtAuthGuard) @Post('jobs/:id/apply') apply(@Param('id') id:string,@CurrentUser() user:AuthUser,@Body() dto:ApplyJobDto){return this.service.apply(id,user.id,dto)}
 @UseGuards(JwtAuthGuard) @Get('tasks/mine') tasks(@CurrentUser() user:AuthUser){return this.service.assignedTasks(user.id)}
 @UseGuards(JwtAuthGuard) @Post('tasks/:id/complete') completeTask(@Param('id') id:string,@CurrentUser() user:AuthUser){return this.service.assignedDone(id,user.id)}
 @UseGuards(JwtAuthGuard) @Get('applications/mine') mine(@CurrentUser() user:AuthUser){return this.service.myApplications(user.id)}
}
@UseGuards(JwtAuthGuard,RolesGuard) @Roles(Role.Admin)
@Controller('school/admin')
export class SchoolAdminController {
 constructor(private readonly service:SchoolService){}
 @Get('enquiries') enquiries(@Query('offset') offset?:string,@Query('status') status?:string){return this.service.enquiries(page(offset),status)}
 @Patch('enquiries/:id') reviewEnquiry(@Param('id') id:string,@Body() dto:ReviewEnquiryDto){return this.service.reviewEnquiry(id,dto)}
 @Get('jobs') jobs(){return this.service.jobs(true)}
 @Post('jobs') createJob(@CurrentUser() user:AuthUser,@Body() dto:JobDto){return this.service.saveJob(user.id,dto)}
 @Patch('jobs/:id') editJob(@Param('id') id:string,@CurrentUser() user:AuthUser,@Body() dto:JobDto){return this.service.saveJob(user.id,dto,id)}
 @Get('applications') applications(@Query('offset') offset?:string,@Query('jobId') jobId?:string){return this.service.applications(page(offset),jobId)}
 @Patch('applications/:id') reviewApplication(@Param('id') id:string,@Body() dto:ReviewApplicationDto){return this.service.reviewApplication(id,dto)}
 @Get('agenda') agenda(){return this.service.agenda()}
 @Post('tasks') createTask(@CurrentUser() user:AuthUser,@Body() dto:TaskDto){return this.service.saveTask(user.id,dto)}
 @Patch('tasks/:id') editTask(@Param('id') id:string,@CurrentUser() user:AuthUser,@Body() dto:TaskDto){return this.service.saveTask(user.id,dto,id)}
 @Patch('tasks/:id/status') taskDone(@Param('id') id:string,@Body() dto:TaskStatusDto){return this.service.taskDone(id,dto.done)}
}
