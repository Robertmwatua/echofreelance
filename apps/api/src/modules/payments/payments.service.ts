import { receiptPdf } from './receipt'
import { feeQuote } from './fee-policy'
import { BadRequestException, ConflictException, ForbiddenException, Injectable, NotFoundException, ServiceUnavailableException } from '@nestjs/common'
import { CoursePayment, Prisma, Role } from '@prisma/client'
import { AuthUser } from '../../common/current-user.decorator'
import { PrismaService } from '../../prisma/prisma.service'
import { MegapayService, normalizePhone } from './megapay.service'
import { StartPaymentDto } from './payments.dto'

const MAX_FEE_CENTS = 100000000
@Injectable()
export class PaymentsService {
  constructor(private readonly prisma: PrismaService, private readonly provider: MegapayService) {}

  private async serial<T>(operation: (tx: Prisma.TransactionClient) => Promise<T>): Promise<T> {
    for (let attempt = 0; ; attempt++) {
      try { return await this.prisma.$transaction(operation, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable }) }
      catch (e) { if ((e as {code?: string}).code !== 'P2034' || attempt >= 2) throw e }
    }
  }
  async setFee(courseId: string, amountKes: number, policy: {depositPercent?:number;discountPercent?:number;discountUntil?:string|null} = {}) {
    const course = await this.prisma.course.findUnique({ where: { id: courseId } })
    if (!course) throw new NotFoundException('Course not found')
    if (!Number.isInteger(amountKes) || amountKes < 0 || amountKes * 100 > MAX_FEE_CENTS) throw new BadRequestException('Enter a whole KES fee from 0 to 1,000,000.')
    await this.prisma.course.update({ where: { id: courseId }, data: { priceCents: amountKes * 100, feeConfirmed: true, depositPercent: policy.depositPercent ?? course.depositPercent, discountPercent: policy.discountPercent ?? course.discountPercent, ...(policy.discountUntil !== undefined ? {discountUntil:policy.discountUntil?new Date(policy.discountUntil):null}: {}) } })
    return { amountKes, message: 'Fee confirmed. Existing student fee quotes and access are unchanged.' }
  }
  private view(payment: CoursePayment) {
    return { id: payment.id, amountCents: payment.amountCents, status: payment.status, receipt: payment.receipt, detail: payment.detail, createdAt: payment.createdAt, settledAt: payment.settledAt, phone: `••••${payment.phone.slice(-4)}`, providerId: payment.providerId }
  }
  async summary(courseId: string, userId: string) {
    const course = await this.prisma.course.findUnique({ where: { id: courseId }, include: { _count: { select: { lessons: {where:{published:true}} } } } })
    const account = await this.prisma.courseFeeAccount.findUnique({ where: { userId_courseId: { userId, courseId } }, include: { payments: { orderBy: { createdAt: 'desc' } } } })
    if (!course || (!account && !course.published && !course.publicPreview && course.tutorId !== userId)) throw new NotFoundException('Course unavailable for payment')
    const paid = account?.payments.filter(p => p.status === 'Succeeded').reduce((n,p) => n+p.amountCents,0) || 0
    const quote=feeQuote(course)
    const total = account?.totalCents ?? quote.totalCents
    const unlockCents=account?.unlockCents ?? quote.unlockCents
    const enrolled = Boolean(await this.prisma.enrollment.findUnique({ where: { userId_courseId: { userId, courseId } } }))
    const legacyAccess = enrolled && !account
    return { courseId, title: course.title, currency: 'KES', baseCents: account?.baseCents ?? quote.baseCents, discountPercent:account?.discountPercent ?? quote.discountPercent, depositPercent:account?.depositPercent ?? quote.depositPercent, unlockCents, unlockRemainingCents:Math.max(0,unlockCents-paid), registrationFeeCents:course.registrationFeeCents, certificationFeeCents:course.certificationFeeCents, feeConfirmed: course.feeConfirmed, totalCents: total, paidCents: paid, balanceCents: legacyAccess ? 0 : Math.max(0,total-paid), legacyAccess, enrolled, minPaymentCents:enrolled?100:Math.min(15000000,Math.max(100,unlockCents-paid)),
      canPay: this.provider.configured() && course.feeConfirmed && course.published && !course.archived && course._count.lessons > 0 && !legacyAccess && total > paid,
      configured: this.provider.configured(), payments: account?.payments.map(p => this.view(p)) || [] }
  }
  async start(courseId: string, userId: string, dto: StartPaymentDto) {
    if (!this.provider.configured()) throw new ServiceUnavailableException('M-Pesa is not connected yet. Please contact the school.')
    const old = await this.prisma.coursePayment.findUnique({ where: { requestKey: dto.requestKey }, include: { account: true } })
    if (old) {
      if (old.account.userId !== userId || old.account.courseId !== courseId || old.amountCents !== dto.amountKes*100 || old.phone !== normalizePhone(dto.phone)) throw new ConflictException('This payment request was already used. Refresh your fee statement.')
      return this.view(old)
    }
    let payment: CoursePayment
    try {
      payment = await this.serial(async tx => {
        const course = await tx.course.findUnique({ where: { id: courseId }, include: { _count: { select: { lessons: {where:{published:true}} } } } })
        if (!course || !course.published || course.archived || !course._count.lessons) throw new BadRequestException('Enrollment is not open for this course yet.')
        if (!course.feeConfirmed) throw new BadRequestException('This course does not have a payable fee. Contact the school.')
        let account = await tx.courseFeeAccount.findUnique({ where: { userId_courseId: { userId, courseId } } })
        if (!account) {
          if (feeQuote(course).totalCents <= 0) throw new BadRequestException('This course is free. Use Enroll on the course page.')
          const enrollment = await tx.enrollment.findUnique({ where: { userId_courseId: { userId, courseId } } })
          if (enrollment) throw new BadRequestException('Your existing enrollment is preserved. Contact the school for any historical fee balance.')
          account = await tx.courseFeeAccount.create({ data: { userId, courseId, ...feeQuote(course) } })
        }
        if((dto.quotedTotalCents!==undefined&&dto.quotedTotalCents!==account.totalCents)||(dto.quotedDepositCents!==undefined&&dto.quotedDepositCents!==account.unlockCents))throw new ConflictException('The tuition quote changed. Refresh your statement and review the total before paying.')
        const payments = await tx.coursePayment.findMany({ where: { accountId: account.id } })
        if (payments.some(p => p.activeKey)) throw new ConflictException('A payment is already awaiting confirmation. Check its status before trying again.')
        const paid = payments.filter(p => p.status === 'Succeeded').reduce((n,p) => n+p.amountCents,0)
        if (!Number.isInteger(dto.amountKes) || dto.amountKes < 1 || dto.amountKes > 150000 || dto.amountKes*100 > account.totalCents-paid) throw new BadRequestException('Enter a whole KES amount between 1 and your remaining balance (maximum KES 150,000 per payment).')
        const minimum=Math.min(15000000,Math.max(100,account.unlockCents-paid))
        if(dto.amountKes*100<minimum)throw new BadRequestException(`Pay at least KES ${minimum/100} towards the access deposit. Your quote requires KES ${account.unlockCents/100} paid before lessons unlock.`)
        const recent = await tx.coursePayment.count({ where: { account: { userId }, createdAt: { gt: new Date(Date.now()-15*60*1000) } } })
        if (recent >= 10) throw new ConflictException('Too many payment requests. Please wait 15 minutes.')
        return tx.coursePayment.create({ data: { accountId: account.id, amountCents: dto.amountKes*100, phone: normalizePhone(dto.phone), requestKey: dto.requestKey, activeKey: `${userId}:${courseId}` } })
      })
    } catch (e) {
      if ((e as {code?: string}).code === 'P2002') throw new ConflictException('A payment request already exists. Refresh your fee statement before retrying.')
      throw e
    }
    // A timeout is ambiguous: never resend automatically or release the reservation.
    try {
      const result = await this.provider.initiate(dto.amountKes, payment.phone, payment.id)
      if (String(result.success) === '200' && typeof result.transaction_request_id === 'string' && /^[A-Za-z0-9_-]{1,120}$/.test(result.transaction_request_id)) {
        payment = await this.prisma.coursePayment.update({ where: { id: payment.id }, data: { providerId: result.transaction_request_id, status: 'Pending', detail: 'Prompt sent. Enter your M-Pesa PIN on your phone, then wait for confirmation.' } })
      } else {
        payment = await this.prisma.coursePayment.update({ where: { id: payment.id }, data: { detail: 'The provider did not confirm this request. Contact the school with this payment reference before retrying.' } })
      }
    } catch {
      payment = await this.prisma.coursePayment.update({ where: { id: payment.id }, data: { detail: 'Confirmation is delayed. Do not send another payment. Contact the school with this payment reference.' } })
    }
    return this.view(payment)
  }
  async check(id: string, user: AuthUser) {
    const payment = await this.prisma.coursePayment.findUnique({ where: { id }, include: { account: true } })
    if (!payment) throw new NotFoundException('Payment not found')
    if (payment.account.userId !== user.id && user.role !== Role.Admin) throw new ForbiddenException('This payment belongs to another account')
    await this.verify(payment)
    return this.view((await this.prisma.coursePayment.findUnique({ where: { id } }))!)
  }
  async webhook(providerId: string) {
    const payment = await this.prisma.coursePayment.findUnique({ where: { providerId } })
    if (payment) await this.verify(payment)
    return { received: true }
  }
  private async verify(payment: CoursePayment) {
    if (!payment.providerId || payment.status === 'Succeeded' || payment.status === 'Failed' || payment.status === 'Review') return
    // An unsigned callback is only a hint. Ask MegaPay with our server-held credentials.
    const lock = await this.prisma.coursePayment.updateMany({ where: { id: payment.id, status: 'Pending', OR: [{ verifiedAt: null }, { verifiedAt: { lt: new Date(Date.now()-10000) } }] }, data: { verifiedAt: new Date() } })
    if (!lock.count) return
    let result: Record<string, unknown>
    try { result = await this.provider.status(payment.providerId) } catch { return }
    if (String(result.ResultCode) !== '200' || result.TransactionID !== payment.providerId) return
    if (result.TransactionStatus === 'Completed' && String(result.TransactionCode) === '0') {
      let phone: string
      try { phone = normalizePhone(String(result.Msisdn)) } catch { phone = '' }
      const valid = Number(result.TransactionAmount)*100 === payment.amountCents && phone === payment.phone && result.TransactionReference === payment.id && typeof result.TransactionReceipt === 'string' && /^[A-Za-z0-9]{6,32}$/.test(result.TransactionReceipt)
      if (!valid) {
        await this.prisma.coursePayment.updateMany({ where: { id: payment.id, status: 'Pending' }, data: { status: 'Review', detail: 'Payment details need review by the school. Keep your M-Pesa receipt; do not pay again.' } })
        return
      }
      try {
        await this.serial(async tx => {
          const fresh = await tx.coursePayment.findUnique({ where: { id: payment.id }, include: { account: true } })
          if (!fresh || fresh.status !== 'Pending') return
          await tx.coursePayment.update({ where: { id: payment.id }, data: { status: 'Succeeded', receipt: String(result.TransactionReceipt).toUpperCase(), settledAt: new Date(), activeKey: null, detail: 'Payment verified and added to your fee statement.' } })
          const aggregate=await tx.coursePayment.aggregate({where:{accountId:fresh.accountId,status:'Succeeded'},_sum:{amountCents:true}})
          if ((aggregate._sum.amountCents||0)>=fresh.account.unlockCents) await tx.enrollment.upsert({ where: { userId_courseId: { userId: fresh.account.userId, courseId: fresh.account.courseId } }, create: { userId: fresh.account.userId, courseId: fresh.account.courseId }, update: {} })
        })
      } catch (e) {
        if ((e as {code?: string}).code !== 'P2002') throw e
        await this.prisma.coursePayment.updateMany({ where: { id: payment.id, status: 'Pending' }, data: { status: 'Review', detail: 'Receipt needs review by the school. Do not pay again.' } })
      }
    } else if (['Failed','Cancelled','Canceled','Expired'].includes(String(result.TransactionStatus)) && result.TransactionCode != null && String(result.TransactionCode) !== '0') {
      await this.prisma.coursePayment.updateMany({ where: { id: payment.id, status: 'Pending' }, data: { status: 'Failed', activeKey: null, settledAt: new Date(), detail: 'Payment was cancelled, declined or expired. No course payment was recorded. You can try again.' } })
    }
  }
  async recover(id: string, providerId: string) {
    const payment = await this.prisma.coursePayment.findUnique({ where: { id } })
    if (!payment || payment.status !== 'Initiating' || payment.providerId) throw new BadRequestException('Only an unresolved initiation can be linked to a provider request.')
    let result: Record<string, unknown>
    try { result = await this.provider.status(providerId) } catch { throw new ServiceUnavailableException('Could not verify the MegaPay request. Try later.') }
    let phone = ''
    try { phone = normalizePhone(String(result.Msisdn)) } catch {}
    if (String(result.ResultCode) !== '200' || result.TransactionID !== providerId || result.TransactionReference !== payment.id || Number(result.TransactionAmount)*100 !== payment.amountCents || phone !== payment.phone) throw new BadRequestException('MegaPay request does not match this payment reference, phone and amount. Nothing was credited.')
    try { const linked = await this.prisma.coursePayment.updateMany({ where: { id, status: 'Initiating', providerId: null }, data: { providerId, status: 'Pending', verifiedAt: null, detail: 'Provider request recovered. Awaiting verified status.' } }); if (!linked.count) throw new ConflictException('This payment was already recovered. Refresh the ledger.') }
    catch (e) { if ((e as {code?:string}).code === 'P2002') throw new ConflictException('This provider request is linked to another payment.'); throw e }
    await this.verify((await this.prisma.coursePayment.findUnique({ where: { id } }))!)
    return this.view((await this.prisma.coursePayment.findUnique({ where: { id } }))!)
  }
  async adminList(offset = 0) {
    const payments = await this.prisma.coursePayment.findMany({ orderBy: { createdAt: 'desc' }, skip: offset, take: 50, include: { account: { include: { user: { select: { name: true, email: true } }, course: { select: { id: true, title: true } } } } } })
    const total = await this.prisma.coursePayment.count()
    const balances = await this.prisma.coursePayment.groupBy({ by: ['accountId'], where: { accountId: { in: [...new Set(payments.map(p => p.accountId))] }, status: 'Succeeded' }, _sum: { amountCents: true } })
    const paid = new Map(balances.map(b => [b.accountId,b._sum.amountCents || 0]))
    return { total, configured: this.provider.configured(), payments: payments.map(p => ({ ...this.view(p), user: p.account.user, course: p.account.course, totalCents: p.account.totalCents, paidCents: paid.get(p.accountId) || 0, balanceCents: Math.max(0,p.account.totalCents-(paid.get(p.accountId) || 0)) })) }
  }
  async receipt(id:string,user:AuthUser) {
    const payment=await this.prisma.coursePayment.findUnique({where:{id},include:{account:{include:{user:{select:{name:true,email:true}},course:{select:{title:true}}}}}})
    if(!payment)throw new NotFoundException('Receipt not found')
    if(payment.account.userId!==user.id&&user.role!==Role.Admin)throw new ForbiddenException()
    if(payment.status!=='Succeeded'||!payment.receipt||!payment.settledAt)throw new BadRequestException('A receipt is available after payment verification.')
    const previous=await this.prisma.coursePayment.aggregate({where:{accountId:payment.accountId,status:'Succeeded',settledAt:{lte:payment.settledAt}},_sum:{amountCents:true}})
    const paidCents=previous._sum.amountCents||0
    return receiptPdf({reference:payment.id,receipt:payment.receipt,student:payment.account.user.name||payment.account.user.email,email:payment.account.user.email,course:payment.account.course.title,amountCents:payment.amountCents,totalCents:payment.account.totalCents,paidCents,balanceCents:Math.max(0,payment.account.totalCents-paidCents),settledAt:payment.settledAt})
  }
  async studentGroup(courseId:string,userId:string){
    const account=await this.prisma.courseFeeAccount.findUnique({where:{userId_courseId:{userId,courseId}},include:{payments:{where:{status:'Succeeded'},select:{amountCents:true}}}})
    const enrolled=await this.prisma.enrollment.findUnique({where:{userId_courseId:{userId,courseId}}})
    const paid=account?.payments.reduce((n,p)=>n+p.amountCents,0)||0
    if(!account||!enrolled||paid<=0||paid<account.unlockCents)throw new ForbiddenException('The student group opens after your access deposit is verified. Contact admissions about offline payments.')
    const url=process.env.STUDENT_WHATSAPP_GROUP_URL?.trim();if(!url)throw new ServiceUnavailableException('The student group invitation is being connected. Please contact the school.');let parsed:URL;try{parsed=new URL(url)}catch{throw new ServiceUnavailableException('The student group invitation needs updating.')}if(parsed.protocol!=='https:'||parsed.hostname!=='chat.whatsapp.com'||parsed.username||parsed.password)throw new ServiceUnavailableException('The student group invitation needs updating.');return {url}
  }
  async reconciliation(offset=0) {
    const accounts=await this.prisma.courseFeeAccount.findMany({skip:offset,take:30,orderBy:{createdAt:'desc'},include:{user:{select:{name:true,email:true}},course:{select:{id:true,title:true}},payments:{select:{id:true,status:true,amountCents:true,createdAt:true}}}})
    const total=await this.prisma.courseFeeAccount.count()
    return {total,items:accounts.map(a=>{const paidCents=a.payments.filter(p=>p.status==='Succeeded').reduce((n,p)=>n+p.amountCents,0);return {id:a.id,user:a.user,course:a.course,totalCents:a.totalCents,paidCents,balanceCents:Math.max(0,a.totalCents-paidCents),unlockRemainingCents:Math.max(0,a.unlockCents-paidCents),delayed:a.payments.filter(p=>['Initiating','Pending','Review'].includes(p.status)&&Date.now()-p.createdAt.getTime()>15*60000).map(p=>({id:p.id,status:p.status,createdAt:p.createdAt})),hasPayment:paidCents>0}})}
  }
  async mine(userId: string) {
    const accounts = await this.prisma.courseFeeAccount.findMany({ where: { userId }, select: { courseId: true } })
    return Promise.all(accounts.map(a => this.summary(a.courseId,userId)))
  }
}
