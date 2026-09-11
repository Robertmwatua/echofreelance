import { Module, forwardRef } from '@nestjs/common'
import { CampusModule } from '../campus/campus.module'
import { ProgressController } from './progress.controller'
import { ProgressService } from './progress.service'

@Module({
  imports: [forwardRef(() => CampusModule)],
  controllers: [ProgressController],
  providers: [ProgressService],
  exports: [ProgressService],
})
export class ProgressModule {}
