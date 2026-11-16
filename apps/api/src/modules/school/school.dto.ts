import { Equals, IsBoolean, IsDateString, IsEmail, IsIn, IsOptional, IsString, IsUrl, MaxLength, MinLength, ValidateIf } from 'class-validator'
export class EnquiryDto {
  @IsString() @MinLength(2) @MaxLength(100) name!: string
  @IsEmail() @MaxLength(200) email!: string
  @IsOptional() @IsString() @MaxLength(30) phone?: string
  @IsString() @MinLength(10) @MaxLength(3000) message!: string
  @IsOptional() @IsString() @MaxLength(60) courseId?: string
  @Equals(true) consent!: boolean
  @IsOptional() @Equals('') website?: string
}
export class ReviewEnquiryDto {
  @IsIn(['New','Contacted','Closed']) status!: string
  @IsString() @MaxLength(5000) notes!: string
}
export class JobDto {
  @IsString() @MinLength(3) @MaxLength(150) title!: string
  @IsString() @MinLength(2) @MaxLength(150) company!: string
  @IsString() @MinLength(2) @MaxLength(150) location!: string
  @IsIn(['Full-time','Part-time','Contract','Internship','Apprenticeship']) kind!: string
  @IsString() @MinLength(30) @MaxLength(12000) description!: string
  @IsOptional() @IsDateString() deadline?: string | null
  @IsBoolean() published!: boolean
}
export class ApplyJobDto {
  @IsString() @MinLength(30) @MaxLength(5000) coverLetter!: string
  @IsUrl({protocols:['https'],require_protocol:true}) @MaxLength(1500) resumeUrl!: string
  @IsOptional() @IsUrl({protocols:['https'],require_protocol:true}) @MaxLength(1500) portfolioUrl?: string
  @Equals(true) consent!: boolean
}
export class ReviewApplicationDto {
  @IsIn(['Received','Reviewing','Interview','Closed']) status!: string
  @IsString() @MaxLength(5000) reviewNotes!: string
}
export class TaskDto {
  @IsOptional() @IsIn(["Task","Intake","Deadline"]) kind?:string
  @IsString() @MinLength(3) @MaxLength(150) title!: string
  @IsString() @MaxLength(3000) details!: string
  @IsDateString() dueAt!: string
  @IsOptional() @IsString() @MaxLength(60) assigneeId?: string | null
}
export class TaskStatusDto {
  @IsBoolean() done!: boolean
}
