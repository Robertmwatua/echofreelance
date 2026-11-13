import { jwtSecret } from './jwt-secret'
import { Injectable, UnauthorizedException } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { PassportStrategy } from '@nestjs/passport'
import { ExtractJwt, Strategy } from 'passport-jwt'
import { PrismaService } from '../../prisma/prisma.service'

export type JwtPayload = {
  sub: string
  email: string
  version?: number
  role: string
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    config: ConfigService,
    private readonly prisma: PrismaService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: jwtSecret(config),
      algorithms: ['HS256'],
    })
  }

  async validate(payload: JwtPayload) {
    if (typeof payload.sub !== 'string' || !payload.sub) throw new UnauthorizedException()
    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
      select: { id: true, email: true, name: true, role: true, sessionVersion: true },
    })
    if (!user || (payload.version ?? 0) !== user.sessionVersion) throw new UnauthorizedException('Session revoked. Sign in again.')
    const { sessionVersion, ...profile } = user
    return profile
  }
}
