import {
  IsBoolean,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  Min,
  MinLength,
} from 'class-validator'

const CATEGORIES = ['Pwn', 'Web', 'Crypto', 'Forensics', 'Reverse', 'Misc'] as const

export class CreateChallengeDto {
  @IsString()
  @MinLength(3)
  title!: string

  @IsOptional()
  @IsString()
  courseId?: string

  @IsIn(CATEGORIES)
  category!: (typeof CATEGORIES)[number]

  @IsOptional()
  @IsString()
  difficulty?: string

  @IsOptional()
  @IsInt()
  @Min(1)
  points?: number

  @IsString()
  @MinLength(20)
  description!: string

  @IsOptional()
  @IsString()
  hint?: string

  @IsString()
  @MinLength(4)
  flag!: string

  @IsOptional()
  @IsBoolean()
  published?: boolean
}

export class SubmitFlagDto {
  @IsString()
  @MinLength(4)
  flag!: string
}
