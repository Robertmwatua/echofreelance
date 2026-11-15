import { IsEmail, IsString, MaxLength, MinLength, Matches } from 'class-validator'
export class ForgotPasswordDto { @IsEmail() @MaxLength(200) email!:string }
export class ResetPasswordDto {
 @IsString() @Matches(/^[a-f0-9]{64}$/) token!:string
 @IsString() @MinLength(10) @MaxLength(128) password!:string
}
export class GoogleLoginDto {
 @IsString() @MinLength(20) @MaxLength(10000) credential!:string
 @IsString() @Matches(/^[a-f0-9]{64}$/) challenge!:string
}
