import {
  IsEmail,
  IsOptional,
  IsString,
  MinLength,
  ValidateIf,
} from 'class-validator'

export class UpdateProfileDto {
  @IsOptional()
  @IsString()
  @MinLength(2)
  name?: string

  @IsOptional()
  @IsString()
  headline?: string

  @IsOptional()
  @IsString()
  bio?: string
}

export class ChangePasswordDto {
  @IsString()
  @MinLength(8)
  currentPassword!: string

  @IsString()
  @MinLength(8)
  newPassword!: string
}

export class AdminResetPasswordDto {
  @IsString()
  @MinLength(8)
  newPassword!: string
}

export class AdminUpdateUserDto {
  @IsOptional()
  @IsString()
  @MinLength(2)
  name?: string

  @IsOptional()
  @IsEmail()
  email?: string

  @IsOptional()
  @ValidateIf((_, v) => v !== undefined && v !== '')
  @IsString()
  @MinLength(8)
  newPassword?: string
}
