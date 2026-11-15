import { Module } from '@nestjs/common'
import { PaymentsController } from './payments.controller'
import { PaymentsService } from './payments.service'
import { MegapayService } from './megapay.service'
@Module({ controllers: [PaymentsController], providers: [PaymentsService, MegapayService] })
export class PaymentsModule {}
