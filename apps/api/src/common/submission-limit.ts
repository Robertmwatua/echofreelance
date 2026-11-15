import { HttpException } from '@nestjs/common'
import { createHash } from 'crypto'
import { PrismaService } from '../prisma/prisma.service'
export async function submissionLimit(prisma:PrismaService,scope:string,identity:string,max:number) {
 const hour=Math.floor(Date.now()/3600000),bucket=createHash('sha256').update(`${scope}:${identity}:${hour}`).digest('hex')
 const result=await prisma.submissionLimit.upsert({where:{bucket},create:{bucket,expiresAt:new Date((hour+2)*3600000)},update:{count:{increment:1}}})
 if(result.count>max)throw new HttpException('Too many requests. Please try again in an hour.',429)
 await prisma.submissionLimit.deleteMany({where:{expiresAt:{lt:new Date()}}})
}
