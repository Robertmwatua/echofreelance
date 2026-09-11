import { IsString, MinLength } from 'class-validator'

export class CreateDiscussionDto {
  @IsString()
  @MinLength(2)
  body!: string
}

export class UpsertNoteDto {
  @IsString()
  body!: string
}
