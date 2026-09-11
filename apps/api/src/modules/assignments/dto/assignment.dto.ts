import {
  IsDateString,
  IsInt,
  IsOptional,
  IsString,
  IsUrl,
  Max,
  Min,
  MinLength,
} from 'class-validator'

export class CreateAssignmentDto {
  @IsString()
  courseId!: string

  @IsString()
  @MinLength(3)
  title!: string

  @IsString()
  @MinLength(10)
  instructions!: string

  @IsOptional()
  @IsDateString()
  dueAt?: string

  @IsOptional()
  @IsInt()
  @Min(1)
  maxPoints?: number
}

export class SubmitAssignmentDto {
  @IsString()
  @MinLength(5)
  content!: string

  @IsOptional()
  @IsUrl({ require_protocol: true })
  linkUrl?: string
}

export class GradeSubmissionDto {
  @IsInt()
  @Min(0)
  @Max(1000)
  grade!: number

  @IsOptional()
  @IsString()
  feedback?: string
}
