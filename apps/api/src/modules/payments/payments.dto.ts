import { IsInt, IsString, IsUUID, Matches, Max, Min } from 'class-validator'

export class SetCourseFeeDto {
  @IsInt() @Min(0) @Max(1000000) amountKes!: number
}
export class StartPaymentDto {
  @IsInt() @Min(1) @Max(150000) amountKes!: number
  @IsString() @Matches(/^(?:\+?254|0)(?:7|1)\d{8}$/) phone!: string
  @IsUUID('4') requestKey!: string
}
export class PaymentWebhookDto {
  @IsString() @Matches(/^[A-Za-z0-9_-]{1,120}$/) TransactionID!: string
}
export class RecoverPaymentDto {
  @IsString() @Matches(/^[A-Za-z0-9_-]{1,120}$/) providerId!: string
}
