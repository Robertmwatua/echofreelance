import { BadRequestException, ConflictException, Injectable, ServiceUnavailableException, UnauthorizedException } from '@nestjs/common'
import { OAuth2Client } from 'google-auth-library'
import { createHash, randomBytes } from 'crypto'
import * as bcrypt from 'bcryptjs'
import * as nodemailer from 'nodemailer'
import { PrismaService } from '../../prisma/prisma.service'
import { submissionLimit } from '../../common/submission-limit'
import { AuthService } from './auth.service'
const hash=(value:string)=>createHash('sha256').update(value).digest('hex')
const generic={message:'If an account exists for this address, a reset link will arrive shortly. Check your spam folder too.'}
@Injectable()
export class AccountAccessService {
 constructor(private readonly prisma:PrismaService,private readonly auth:AuthService){}
 options(){return {googleClientId:process.env.GOOGLE_CLIENT_ID||null,resetConfigured:Boolean(process.env.SMTP_HOST&&process.env.SMTP_USER&&process.env.SMTP_PASS&&process.env.SMTP_FROM)}}
 async challenge(ip:string){if(!this.options().googleClientId)throw new ServiceUnavailableException('Google sign-in is being connected. Use your email and password.');await submissionLimit(this.prisma,'google-start',ip,60);const challenge=randomBytes(32).toString('hex');await this.prisma.accountToken.create({data:{hash:hash(challenge),purpose:'Google',expiresAt:new Date(Date.now()+5*60000)}});return {challenge}}
 async google(credential:string,challenge:string,ip:string){
  const clientId=this.options().googleClientId
  if(!clientId)throw new ServiceUnavailableException('Google sign-in is not configured yet.')
  await submissionLimit(this.prisma,'google-login',ip,60)
  let payload
  try {const ticket=await new OAuth2Client(clientId).verifyIdToken({idToken:credential,audience:clientId});payload=ticket.getPayload()}catch{throw new UnauthorizedException('Google could not verify this sign-in. Please try again.')}
  if(!payload?.email||!payload.email_verified||(payload as {nonce?:string}).nonce!==challenge)throw new UnauthorizedException('Google sign-in did not match this browser request.')
  const google=payload,email=payload.email.toLowerCase(),passwordHash=await bcrypt.hash(randomBytes(32).toString('hex'),10)
  try {
   const user=await this.prisma.$transaction(async tx=>{
    const consumed=await tx.accountToken.updateMany({where:{hash:hash(challenge),purpose:'Google',usedAt:null,expiresAt:{gt:new Date()}},data:{usedAt:new Date()}})
    if(!consumed.count)throw new UnauthorizedException('This sign-in expired or was already used. Start again.')
    const identity=await tx.googleIdentity.findUnique({where:{subject:google.sub},include:{user:true}})
    if(identity)return identity.user
    let user=await tx.user.findUnique({where:{email}})
    // Google is authoritative for Gmail and verified Workspace domains. Do not
    // silently link an existing account on a third-party email-domain claim.
    if(user&&!email.endsWith('@gmail.com')&&!google.hd)throw new ConflictException('Use your email/password for this existing account. Contact the school if you need help.')
    if(!user)user=await tx.user.create({data:{email,name:google.name?.slice(0,100)||null,passwordHash}})
    await tx.googleIdentity.create({data:{subject:google.sub,userId:user.id}})
    return user
   },{isolationLevel:'Serializable'})
   return this.auth.buildAuthResponse(user)
  }catch(e){if(['P2002','P2034'].includes((e as {code?:string}).code||''))throw new ConflictException('The account changed during sign-in. Please try again.');throw e}
 }
 async forgot(email:string,ip:string){
  if(!this.options().resetConfigured)throw new ServiceUnavailableException('Password recovery email is being connected. Please contact the school for help.')
  await submissionLimit(this.prisma,'reset-ip',ip,30);email=email.trim().toLowerCase();await submissionLimit(this.prisma,'reset-email',email,3)
  const user=await this.prisma.user.findUnique({where:{email}});if(!user)return generic
  const token=randomBytes(32).toString('hex')
  await this.prisma.$transaction(async tx=>{await tx.accountToken.updateMany({where:{userId:user.id,purpose:'Reset',usedAt:null},data:{usedAt:new Date()}});await tx.accountToken.create({data:{hash:hash(token),purpose:'Reset',userId:user.id,expiresAt:new Date(Date.now()+15*60000)}})})
  const origin=new URL(process.env.WEB_URL||'https://www.echofreelancetechschool.com').origin
  const link=`${origin}/reset-password#token=${token}`
  try {const port=Number(process.env.SMTP_PORT)||587;const transport=nodemailer.createTransport({host:process.env.SMTP_HOST,port,secure:port===465,requireTLS:port!==465,auth:{user:process.env.SMTP_USER,pass:process.env.SMTP_PASS},connectionTimeout:8000,socketTimeout:10000});await transport.sendMail({from:process.env.SMTP_FROM,to:user.email,subject:'Reset your EchoFreelance password',text:`Reset your EchoFreelance password using this link:\n\n${link}\n\nThis single-use link expires in 15 minutes. If you did not request this, you can ignore this email. We will never ask for your password or M-Pesa PIN.`})}catch{await this.prisma.accountToken.updateMany({where:{hash:hash(token)},data:{usedAt:new Date()}});console.error('Password-reset email delivery failed. Check backend SMTP settings.')}
  return generic
 }
 async reset(token:string,password:string,ip:string){
  await submissionLimit(this.prisma,'reset-submit',ip,30)
  const found=await this.prisma.accountToken.findUnique({where:{hash:hash(token)}})
  if(!found||found.purpose!=='Reset'||found.usedAt||found.expiresAt.getTime()<=Date.now())throw new BadRequestException('This reset link expired or was already used. Request a new one.')
  const passwordHash=await bcrypt.hash(password,10)
  await this.prisma.$transaction(async tx=>{
   const record=await tx.accountToken.findUnique({where:{hash:hash(token)}})
   if(!record||record.purpose!=='Reset'||!record.userId||record.usedAt||record.expiresAt.getTime()<=Date.now())throw new BadRequestException('This reset link expired or was already used. Request a new one.')
   const used=await tx.accountToken.updateMany({where:{id:record.id,usedAt:null},data:{usedAt:new Date()}});if(!used.count)throw new BadRequestException('This reset link was already used.')
   await tx.user.update({where:{id:record.userId},data:{passwordHash,sessionVersion:{increment:1}}})
   await tx.accountToken.updateMany({where:{userId:record.userId,purpose:'Reset',usedAt:null},data:{usedAt:new Date()}})
  })
  return {message:'Password updated. Sign in again on your devices.'}
 }
}
