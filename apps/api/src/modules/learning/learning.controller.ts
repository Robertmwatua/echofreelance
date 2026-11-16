import {Roles} from '../../common/roles.decorator'
import {RolesGuard} from '../../common/roles.guard'
import {Role} from '@prisma/client'
import {Body,Controller,Get,Param,Post,Put,UseGuards} from '@nestjs/common'
import {AuthUser,CurrentUser} from '../../common/current-user.decorator'
import {JwtAuthGuard} from '../auth/jwt-auth.guard'
import {LearningService} from './learning.service'
import {AttemptQuizDto,MarkAttendanceDto,SaveQuizDto} from './learning.dto'
@Controller('learning')
@UseGuards(JwtAuthGuard)
export class LearningController {
 constructor(private learning:LearningService){}
 @Get('courses/:id/quizzes') quizzes(@Param('id') id:string,@CurrentUser() user:AuthUser){return this.learning.quizzes(id,user)}
 @UseGuards(RolesGuard) @Roles(Role.Tutor,Role.Admin)
 @Put('lessons/:id/quiz') save(@Param('id') id:string,@Body() dto:SaveQuizDto,@CurrentUser() user:AuthUser){return this.learning.save(id,user,dto)}
 @Post('quizzes/:id/attempts') attempt(@Param('id') id:string,@Body() dto:AttemptQuizDto,@CurrentUser() user:AuthUser){return this.learning.attempt(id,user,dto)}
 @UseGuards(RolesGuard) @Roles(Role.Tutor,Role.Admin)
 @Put('classes/:id/attendance/:userId') mark(@Param('id') id:string,@Param('userId') userId:string,@Body() dto:MarkAttendanceDto,@CurrentUser() user:AuthUser){return this.learning.markAttendance(id,userId,user,dto.status)}
 @Get('attendance') attendance(@CurrentUser() user:AuthUser){return this.learning.attendance(user)}
}
