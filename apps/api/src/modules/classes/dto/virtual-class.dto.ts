import {
  IsDateString,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  IsUrl,
  Max,
  Min,
  MinLength,
} from 'class-validator'

const CLASS_STATUSES = ['Scheduled', 'Live', 'Completed', 'Cancelled'] as const

export class CreateVirtualClassDto {
  @IsString()
  courseId!: string

  @IsString()
  @MinLength(3)
  title!: string

  @IsOptional()
  @IsString()
  description?: string

  @IsDateString()
  startsAt!: string

  @IsDateString()
  endsAt!: string

  @IsOptional()
  @IsUrl({ require_protocol: true })
  meetingUrl?: string
}

export class InstantMeetingDto {
  @IsString()
  courseId!: string

  @IsOptional()
  @IsString()
  @MinLength(3)
  title?: string

  @IsOptional()
  @IsString()
  description?: string

  @IsOptional()
  @IsInt()
  @Min(15)
  @Max(240)
  durationMinutes?: number
}

export class UpdateVirtualClassDto {
  @IsOptional()
  @IsString()
  @MinLength(3)
  title?: string

  @IsOptional()
  @IsString()
  description?: string

  @IsOptional()
  @IsDateString()
  startsAt?: string

  @IsOptional()
  @IsDateString()
  endsAt?: string

  @IsOptional()
  @IsUrl({ require_protocol: true })
  meetingUrl?: string

  @IsOptional()
  @IsUrl({ require_protocol: true })
  recordingUrl?: string

  @IsOptional()
  @IsIn(CLASS_STATUSES)
  status?: (typeof CLASS_STATUSES)[number]
}
