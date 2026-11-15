import { AccountAccessService } from './account-access.service'
import { ForgotPasswordDto,ResetPasswordDto,GoogleLoginDto } from './account-access.dto'
import { Body, Controller, Get, Post, Req } from '@nestjs/common'
import { AuthService } from './auth.service'
import { LoginDto, RegisterDto } from './dto/auth.dto'

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService,private readonly access:AccountAccessService) {}

  @Get('options') options(){return this.access.options()}
  @Get('google/challenge') challenge(@Req() req:{ip?:string}){return this.access.challenge(req.ip||'unknown')}
  @Post('google') google(@Body() dto:GoogleLoginDto,@Req() req:{ip?:string}){return this.access.google(dto.credential,dto.challenge,req.ip||'unknown')}
  @Post('forgot-password') forgot(@Body() dto:ForgotPasswordDto,@Req() req:{ip?:string}){return this.access.forgot(dto.email,req.ip||'unknown')}
  @Post('reset-password') reset(@Body() dto:ResetPasswordDto,@Req() req:{ip?:string}){return this.access.reset(dto.token,dto.password,req.ip||'unknown')}

  @Post('register')
  register(@Body() dto: RegisterDto) {
    return this.authService.register(dto)
  }

  @Post('login')
  login(@Body() dto: LoginDto) {
    return this.authService.login(dto)
  }
}
