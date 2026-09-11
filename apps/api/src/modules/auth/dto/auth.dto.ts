import { IsEmail, IsIn, IsOptional, IsString, MinLength } from 'class-validator'

const ROLES = ['Student', 'Tutor', 'Admin'] as const

export class RegisterDto {
  @IsEmail()
  email!: string

  @IsString()
  @MinLength(8)
  password!: string

  @IsOptional()
  @IsString()
  name?: string
}

export class LoginDto {
  @IsEmail()
  email!: string

  @IsString()
  @MinLength(8)
  password!: string
}

export class UpdateRoleDto {
  @IsIn(ROLES)
  role!: (typeof ROLES)[number]
}
