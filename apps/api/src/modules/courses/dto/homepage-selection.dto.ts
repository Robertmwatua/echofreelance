import {ArrayMaxSize,ArrayUnique,IsArray,IsString,MaxLength,MinLength} from 'class-validator'
export class HomepageSelectionDto {
 @IsArray() @ArrayMaxSize(3) @ArrayUnique() @IsString({each:true}) @MinLength(1,{each:true}) @MaxLength(100,{each:true})
 courseIds!:string[]
}
