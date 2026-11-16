import {
  IsBoolean,
  MaxLength,
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
  @IsOptional() @IsBoolean() requiredForCertificate?:boolean
  @IsOptional() @IsInt() @Min(1) @Max(100) passPercent?:number
  @IsString()
  courseId!: string

  @IsString()
  @MinLength(3)
  @MaxLength(200)
  title!: string

  @IsString()
  @MinLength(10)
  @MaxLength(20000)
  instructions!: string

  @IsOptional()
  @IsDateString()
  dueAt?: string

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(1000)
  maxPoints?: number
}

export class SubmitAssignmentDto {
  @IsString()
  @MinLength(5)
  @MaxLength(30000)
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
  @MaxLength(5000)
  feedback?: string
}
