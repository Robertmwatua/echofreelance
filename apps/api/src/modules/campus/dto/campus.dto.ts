import { IsInt, IsOptional, IsString, Max, Min, MinLength } from 'class-validator'

export class CreateReviewDto {
  @IsInt()
  @Min(1)
  @Max(5)
  rating!: number

  @IsOptional()
  @IsString()
  comment?: string
}

export class CreateResourceDto {
  @IsString()
  lessonId!: string

  @IsString()
  @MinLength(2)
  title!: string

  @IsString()
  @MinLength(8)
  url!: string

  @IsOptional()
  @IsString()
  kind?: string
}

export class CreateAnnouncementDto {
  @IsString()
  courseId!: string

  @IsString()
  @MinLength(3)
  title!: string

  @IsString()
  @MinLength(5)
  body!: string
}
