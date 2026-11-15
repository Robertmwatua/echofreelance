import { Body, Controller, Get, Header, HttpCode, Param, Patch, Post, Query, StreamableFile, UseGuards } from '@nestjs/common'
import { Role } from '@prisma/client'
import { AuthUser, CurrentUser } from '../../common/current-user.decorator'
import { Roles } from '../../common/roles.decorator'
import { RolesGuard } from '../../common/roles.guard'
import { JwtAuthGuard } from '../auth/jwt-auth.guard'
import { RecoverPaymentDto, SetCourseFeeDto, StartPaymentDto } from './payments.dto'
import { PaymentsService } from './payments.service'

@Controller('payments')
export class PaymentsController {
  constructor(private readonly payments: PaymentsService) {}
  @UseGuards(JwtAuthGuard) @Get('mine')
  mine(@CurrentUser() user: AuthUser) { return this.payments.mine(user.id) }
  @UseGuards(JwtAuthGuard, RolesGuard) @Roles(Role.Admin) @Get('admin')
  admin(@Query('offset') offset?: string) { return this.payments.adminList(Math.max(0,Math.min(100000,Math.floor(Number(offset)||0)))) }
  @UseGuards(JwtAuthGuard, RolesGuard) @Roles(Role.Admin) @Get('reconciliation')
  reconciliation(@Query('offset') offset?:string){return this.payments.reconciliation(Math.max(0,Math.min(100000,Math.floor(Number(offset)||0))))}
  @UseGuards(JwtAuthGuard, RolesGuard) @Roles(Role.Admin) @Patch('courses/:id/fee')
  fee(@Param('id') id: string, @Body() body: SetCourseFeeDto) { return this.payments.setFee(id,body.amountKes,body) }
  @UseGuards(JwtAuthGuard) @Get('courses/:id/community')
  community(@Param('id') id:string,@CurrentUser() user:AuthUser){return this.payments.studentGroup(id,user.id)}
  @UseGuards(JwtAuthGuard) @Get('courses/:id')
  summary(@Param('id') id: string, @CurrentUser() user: AuthUser) { return this.payments.summary(id,user.id) }
  @UseGuards(JwtAuthGuard) @Post('courses/:id')
  start(@Param('id') id: string, @Body() body: StartPaymentDto, @CurrentUser() user: AuthUser) { return this.payments.start(id,user.id,body) }
  @UseGuards(JwtAuthGuard) @Get(':id/receipt') @Header('Cache-Control','no-store')
  async receipt(@Param('id') id:string,@CurrentUser() user:AuthUser){const pdf=await this.payments.receipt(id,user);return new StreamableFile(pdf,{type:'application/pdf',disposition:'attachment; filename="EchoFreelance-receipt.pdf"'})}
  @UseGuards(JwtAuthGuard) @Post(':id/check')
  check(@Param('id') id: string, @CurrentUser() user: AuthUser) { return this.payments.check(id,user) }
  @UseGuards(JwtAuthGuard, RolesGuard) @Roles(Role.Admin) @Post(':id/recover')
  recover(@Param('id') id: string, @Body() body: RecoverPaymentDto) { return this.payments.recover(id,body.providerId) }
  // Strip unsolicited webhook properties. Never trust a callback as evidence of payment.
  @Post('megapay/webhook') @HttpCode(200)
  webhook(@Body('TransactionID') id: unknown) {
    if (typeof id !== 'string' || !/^[A-Za-z0-9_-]{1,120}$/.test(id)) return { received: true }
    return this.payments.webhook(id)
  }
}
