import { createParamDecorator, ExecutionContext } from '@nestjs/common'
import { Role } from '@prisma/client'

export type AuthUser = {
  id: string
  email: string
  name: string | null
  role: Role
}

export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): AuthUser | null => {
    const request = ctx.switchToHttp().getRequest<{ user?: AuthUser | null }>()
    return request.user ?? null
  },
)
