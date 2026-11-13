import { CanActivate, ExecutionContext, HttpException, HttpStatus, Injectable } from '@nestjs/common'

@Injectable()
export class AuthRateGuard implements CanActivate {
  private readonly attempts = new Map<string, { count: number; until: number }>()
  canActivate(context: ExecutionContext) {
    const req = context.switchToHttp().getRequest<{ ip?: string; socket: { remoteAddress?: string }; body?: { email?: unknown } }>()
    const res = context.switchToHttp().getResponse<{ setHeader: (name: string, value: string) => void }>()
    const now = Date.now()
    for (const [key, value] of this.attempts) if (value.until <= now) this.attempts.delete(key)
    const ip = req.ip || req.socket.remoteAddress || 'unknown'
    const email = typeof req.body?.email === 'string' ? req.body.email.trim().toLowerCase().slice(0, 254) : 'unknown'
    // Separate account/IP bursts from school-wide shared-IP traffic.
    for (const [key, limit] of [[`ip:${ip}`, 300], [`account:${ip}:${email}`, 10]] as const) {
      let bucket = this.attempts.get(key)
      if (!bucket && this.attempts.size >= 10000) throw new HttpException('Authentication is busy. Try again later.', HttpStatus.TOO_MANY_REQUESTS)
      if (!bucket) { bucket = { count: 0, until: now + 15 * 60000 }; this.attempts.set(key, bucket) }
      bucket.count++
      if (bucket.count > limit) {
        res.setHeader('Retry-After', String(Math.ceil((bucket.until - now) / 1000)))
        throw new HttpException('Too many sign-in attempts. Please try again later.', HttpStatus.TOO_MANY_REQUESTS)
      }
    }
    return true
  }
}
