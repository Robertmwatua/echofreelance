// Source: tech school v1 Trifold Brochure.pdf, page 2. Dry-run unless --apply.
require('dotenv').config({path:require('node:path').resolve(__dirname,'../.env')})
const {PrismaClient}=require('@prisma/client'),rows=require('../prisma/brochure-fees.json')
const db=new PrismaClient(),apply=process.argv.includes('--apply')
async function main(){
 const owner=await db.course.findUnique({where:{id:rows[0].id},select:{tutorId:true}})
 if(!owner)throw Error('Expected prospectus course not found. Verify the database before importing.')
 const plan=[]
 for(const row of rows){const existing=row.id?await db.course.findUnique({where:{id:row.id}}):await db.course.findFirst({where:{title:row.title}});if(row.id&&!existing)throw Error(`Missing programme: ${row.title}`);plan.push({row,existing})}
 console.log(JSON.stringify({mode:apply?'APPLY':'DRY RUN',courses:plan.map(({row,existing})=>({id:existing?.id||'new',title:row.title,feeKes:row.feeKes,duration:row.duration,depositPercent:50,registrationKes:500,certificationKes:1000}))},null,2))
 if(!apply)return
 await db.$transaction(async tx=>{for(const {row,existing}of plan){const data={title:row.title,priceCents:row.feeKes*100,feeConfirmed:true,programmeDuration:row.duration,registrationFeeCents:50000,certificationFeeCents:100000,depositPercent:50};if(existing)await tx.course.update({where:{id:existing.id},data});else await tx.course.create({data:{...data,tutorId:owner.tutorId,category:row.category,level:'Beginner',description:row.description,roadmapSteps:row.roadmapSteps,published:false,publicPreview:true}})}})
 console.log('Brochure tuition updated. Existing fee quotes, payments, enrolments and publication states were not changed.')
}
main().catch(e=>{console.error(e.message);process.exitCode=1}).finally(()=>db.$disconnect())
