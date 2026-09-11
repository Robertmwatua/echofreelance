import {
  IsBoolean,
  IsInt,
  IsOptional,
  IsString,
  Min,
  MinLength,
} from 'class-validator'

export class CreateCourseDto {
  @IsString()
  @MinLength(3)
  title!: string

  @IsString()
  @MinLength(10)
  description!: string

  @IsOptional()
  @IsString()
  category?: string

  @IsOptional()
  @IsString()
  level?: string

  @IsOptional()
  @IsInt()
  @Min(0)
  priceCents?: number

  @IsOptional()
  @IsBoolean()
  published?: boolean
}

export class UpdateCourseDto {
  @IsOptional()
  @IsString()
  @MinLength(3)
  title?: string

  @IsOptional()
  @IsString()
  @MinLength(10)
  description?: string

  @IsOptional()
  @IsString()
  category?: string

  @IsOptional()
  @IsString()
  level?: string

  @IsOptional()
  @IsInt()
  @Min(0)
  priceCents?: number

  @IsOptional()
  @IsBoolean()
  published?: boolean
}

export class CreateLessonDto {
  @IsString()
  @MinLength(3)
  title!: string

  @IsString()
  @MinLength(10)
  content!: string

  @IsOptional()
  @IsInt()
  @Min(0)
  order?: number

  @IsOptional()
  @IsInt()
  @Min(1)
  durationMinutes?: number

  @IsOptional()
  @IsString()
  videoUrl?: string
}
