import {
  IsBoolean,
  IsArray,
  ValidateIf,
  ArrayMaxSize,
  MaxLength,
  IsInt,
  IsOptional,
  IsString,
  Min,
  MinLength,
} from 'class-validator'

export class CreateCourseDto {
  @ValidateIf((_, value) => value !== undefined)
  @IsArray()
  @ArrayMaxSize(24)
  @IsString({ each: true })
  @MinLength(3, { each: true })
  @MaxLength(180, { each: true })
  roadmapSteps?: string[]

  @ValidateIf((_, value) => value !== undefined)
  @IsBoolean()
  publicPreview?: boolean


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
  @ValidateIf((_, value) => value !== undefined)
  @IsArray()
  @ArrayMaxSize(24)
  @IsString({ each: true })
  @MinLength(3, { each: true })
  @MaxLength(180, { each: true })
  roadmapSteps?: string[]

  @ValidateIf((_, value) => value !== undefined)
  @IsBoolean()
  publicPreview?: boolean


  @IsOptional()
  @IsBoolean()
  archived?: boolean

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
