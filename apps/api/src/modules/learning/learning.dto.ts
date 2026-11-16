import {Type} from 'class-transformer'
import {ArrayMaxSize,ArrayMinSize,IsArray,IsBoolean,IsIn,IsInt,IsOptional,IsString,Max,MaxLength,Min,MinLength,ValidateNested} from 'class-validator'
export class QuizQuestionDto {
 @IsString() @MinLength(3) @MaxLength(500) prompt!:string
 @IsArray() @ArrayMinSize(2) @ArrayMaxSize(4) @IsString({each:true}) @MinLength(1,{each:true}) @MaxLength(300,{each:true}) options!:string[]
 @IsInt() @Min(0) @Max(3) correctIndex!:number
 @IsString() @MinLength(5) @MaxLength(1000) explanation!:string
}
export class SaveQuizDto {
 @IsString() @MinLength(3) @MaxLength(150) title!:string
 @IsInt() @Min(1) @Max(100) passPercent!:number
 @IsBoolean() requiredForCertificate!:boolean
 @IsBoolean() published!:boolean
 @IsArray() @ArrayMinSize(1) @ArrayMaxSize(10) @ValidateNested({each:true}) @Type(()=>QuizQuestionDto) questions!:QuizQuestionDto[]
}
export class AttemptQuizDto {
 @IsInt() @Min(1) revision!:number
 @IsArray() @ArrayMinSize(1) @ArrayMaxSize(10) @IsInt({each:true}) @Min(0,{each:true}) @Max(3,{each:true}) answers!:number[]
}
export class MarkAttendanceDto {
 @IsIn(['Present','Absent','Excused','Unmarked']) status!:string
}
