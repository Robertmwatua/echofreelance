// Run only against a disposable LOCAL PostgreSQL database named ef_payment_test.
const {test,before,after}=require('node:test')
const assert=require('node:assert/strict')
const {randomUUID}=require('node:crypto')
const {PrismaClient}=require('@prisma/client')
const {PaymentsService}=require('../dist/modules/payments/payments.service')
const {CoursesService}=require('../dist/modules/courses/courses.service')
const {PaymentsController}=require('../dist/modules/payments/payments.controller')
const {SetCourseFeeDto,StartPaymentDto}=require('../dist/modules/payments/payments.dto')
const {validateSync}=require('class-validator')
const {GUARDS_METADATA}=require('@nestjs/common/constants')
const url=new URL(process.env.DATABASE_URL||'file:invalid')
if(url.hostname!=='127.0.0.1'||url.pathname!=='/ef_payment_test')throw Error('Refusing to run payment tests outside disposable local ef_payment_test')
const db=new PrismaClient()
const fixtureIds=[]
const accountWhere=(f)=>({userId_courseId:{userId:f.user.id,courseId:f.course.id}})
async function fixture(){
 const user=await db.user.create({data:{email:`payment-${randomUUID()}@example.invalid`,passwordHash:'test-only',role:'Student'}})
 const course=await db.course.create({data:{title:'Isolated payment test',description:'Disposable payment integration test course',tutorId:user.id,published:true,feeConfirmed:true,priceCents:100000,depositPercent:1,lessons:{create:{title:'Lesson one',content:'Local test only'}}}})
 fixtureIds.push({user,course})
 let initiateCalls=0,statusCalls=0,override=null,unknown=false
 const provider={configured:()=>true,initiate:async()=>{initiateCalls++;if(unknown)throw Error('timeout');return {success:'200',transaction_request_id:`TEST-${randomUUID()}`}},status:async(id)=>{
  statusCalls++
  const p=await db.coursePayment.findUnique({where:{providerId:id}})
  return override||{ResultCode:'200',TransactionID:id,TransactionStatus:'Completed',TransactionCode:'0',TransactionReceipt:'TEST'+p.id.slice(-12).toUpperCase(),TransactionAmount:String(p.amountCents/100),Msisdn:p.phone,TransactionReference:p.id}
 }}
 const service=new PaymentsService(db,provider),courses=new CoursesService(db,{})
 return {user,course,service,courses,provider,body:(amountKes=50)=>({amountKes,phone:'0712345678',requestKey:randomUUID()}),calls:()=>({initiateCalls,statusCalls}),override:r=>override=r,unknown:()=>unknown=true}
}
before(async()=>db.$connect())
after(async()=>{for(const f of fixtureIds){const accounts=await db.courseFeeAccount.findMany({where:{courseId:f.course.id}});await db.coursePayment.deleteMany({where:{accountId:{in:accounts.map(a=>a.id)}}});await db.courseFeeAccount.deleteMany({where:{courseId:f.course.id}});await db.course.delete({where:{id:f.course.id}});await db.user.delete({where:{id:f.user.id}})}await db.$disconnect()})

test('admin fee and payment endpoints carry JWT and role guards; malformed amounts/phones rejected',()=>{
 for(const method of ['fee','admin','recover']){assert.equal(Reflect.getMetadata('roles',PaymentsController.prototype[method])[0],'Admin');assert.equal(Reflect.getMetadata(GUARDS_METADATA,PaymentsController.prototype[method]).length,2)}
 for(const method of ['start','summary','check','mine'])assert.equal(Reflect.getMetadata(GUARDS_METADATA,PaymentsController.prototype[method]).length,1)
 for(const body of [{amountKes:0,phone:'0712345678',requestKey:randomUUID()},{amountKes:1.5,phone:'0712345678',requestKey:randomUUID()},{amountKes:1,phone:'bad',requestKey:randomUUID()},{amountKes:1,phone:'0712345678',requestKey:'bad'}])assert.ok(validateSync(Object.assign(new StartPaymentDto(),body)).length)
 assert.ok(validateSync(Object.assign(new SetCourseFeeDto(),{amountKes:-1})).length)
})
test('first confirmed instalment unlocks access atomically and leaves the correct balance',async()=>{
 const f=await fixture();await assert.rejects(f.courses.enroll(f.course.id,f.user.id),/first instalment/)
 const p=await f.service.start(f.course.id,f.user.id,f.body());assert.equal(p.status,'Pending')
 assert.equal(await db.enrollment.count({where:{courseId:f.course.id}}),0)
 await f.service.check(p.id,f.user)
 const s=await f.service.summary(f.course.id,f.user.id);assert.equal(s.paidCents,5000);assert.equal(s.balanceCents,95000);assert.equal(s.enrolled,true);assert.equal(s.payments[0].status,'Succeeded')
 await f.service.webhook(s.payments[0].providerId);await f.service.check(p.id,f.user)
 assert.equal((await f.service.summary(f.course.id,f.user.id)).paidCents,5000)
 assert.equal(await db.enrollment.count({where:{courseId:f.course.id}}),1)
})
test('retries of one request send one STK; another active request is blocked',async()=>{
 const f=await fixture(),body=f.body();const a=await f.service.start(f.course.id,f.user.id,body),b=await f.service.start(f.course.id,f.user.id,body)
 assert.equal(a.id,b.id);assert.equal(f.calls().initiateCalls,1)
 await assert.rejects(f.service.start(f.course.id,f.user.id,f.body()),/already awaiting/)
 await assert.rejects(f.service.start(f.course.id,f.user.id,{...body,amountKes:100}),/already used/)
})
test('simultaneous requests reserve one payment and cannot overcharge the quote',async()=>{
 const f=await fixture();const results=await Promise.allSettled([f.service.start(f.course.id,f.user.id,f.body(800)),f.service.start(f.course.id,f.user.id,f.body(800))])
 assert.equal(results.filter(r=>r.status==='fulfilled').length,1);assert.equal(f.calls().initiateCalls,1)
 assert.equal(await db.coursePayment.count({where:{account:{courseId:f.course.id}}}),1)
})
test('wrong amount, reference, phone, request ID or missing receipt cannot unlock access',async()=>{
 for(const patch of [{TransactionAmount:999},{TransactionReference:'wrong'},{Msisdn:'0711111111'},{TransactionID:'other'},{TransactionReceipt:null}]){
 const f=await fixture(),p=await f.service.start(f.course.id,f.user.id,f.body())
 f.override({ResultCode:'200',TransactionID:p.providerId,TransactionStatus:'Completed',TransactionCode:'0',TransactionReceipt:'TESTRECEIPT',TransactionAmount:50,Msisdn:'0712345678',TransactionReference:p.id,...patch})
 await f.service.check(p.id,f.user);assert.equal(await db.enrollment.count({where:{courseId:f.course.id}}),0);assert.equal((await f.service.summary(f.course.id,f.user.id)).paidCents,0)
 }
})
test('an unknown forged webhook cannot create records or credit fees',async()=>{
 const f=await fixture();await f.service.webhook('FORGED-'+randomUUID());assert.equal(f.calls().statusCalls,0);assert.equal(await db.enrollment.count({where:{courseId:f.course.id}}),0)
})
test('verified cancellation releases pending reservation but creates no access',async()=>{
 const f=await fixture(),p=await f.service.start(f.course.id,f.user.id,f.body())
 f.override({ResultCode:'200',TransactionID:p.providerId,TransactionStatus:'Failed',TransactionCode:'1032'})
 assert.equal((await f.service.check(p.id,f.user)).status,'Failed');assert.equal((await f.service.summary(f.course.id,f.user.id)).enrolled,false)
 const retry=await f.service.start(f.course.id,f.user.id,f.body());assert.notEqual(retry.id,p.id)
})
test('ambiguous provider timeout remains reserved, including when retried',async()=>{
 const f=await fixture();f.unknown();const body=f.body(),p=await f.service.start(f.course.id,f.user.id,body)
 assert.equal(p.status,'Initiating');await f.service.start(f.course.id,f.user.id,body);assert.equal(f.calls().initiateCalls,1)
 await assert.rejects(f.service.start(f.course.id,f.user.id,f.body()),/already awaiting/)
})
test('other students cannot inspect or reuse payment IDs; responses mask phone numbers',async()=>{
 const f=await fixture(),body=f.body(),p=await f.service.start(f.course.id,f.user.id,body)
 assert.equal(p.phone,'••••5678');await assert.rejects(f.service.check(p.id,{id:'other',role:'Student'}),/another account/)
 await assert.rejects(f.service.start(f.course.id,'other',body),/already used/)
})
test('original quote survives later fee changes; payments stop exactly at the balance',async()=>{
 const f=await fixture(),p=await f.service.start(f.course.id,f.user.id,f.body(50));await f.service.check(p.id,f.user)
 await f.service.setFee(f.course.id,2000);assert.equal((await f.service.summary(f.course.id,f.user.id)).totalCents,100000)
 await assert.rejects(f.service.start(f.course.id,f.user.id,f.body(951)),/remaining balance/)
 const rest=await f.service.start(f.course.id,f.user.id,f.body(950));await f.service.check(rest.id,f.user)
 const s=await f.service.summary(f.course.id,f.user.id);assert.equal(s.balanceCents,0);assert.equal(s.paidCents,100000);assert.equal(s.canPay,false)
 await assert.rejects(f.service.start(f.course.id,f.user.id,f.body(1)),/remaining balance/)
})
test('a duplicate receipt rolls back credit and enrollment together',async()=>{
 const a=await fixture(),first=await a.service.start(a.course.id,a.user.id,a.body());const confirmed=await a.service.check(first.id,a.user)
 const b=await fixture(),second=await b.service.start(b.course.id,b.user.id,b.body())
 b.override({ResultCode:'200',TransactionID:second.providerId,TransactionStatus:'Completed',TransactionCode:'0',TransactionReceipt:confirmed.receipt,TransactionAmount:50,Msisdn:'0712345678',TransactionReference:second.id})
 assert.equal((await b.service.check(second.id,b.user)).status,'Review');assert.equal((await b.service.summary(b.course.id,b.user.id)).paidCents,0);assert.equal(await db.enrollment.count({where:{courseId:b.course.id}}),0)
})
test('pending provider status stays unpaid; repeated checks are throttled',async()=>{
 const f=await fixture(),p=await f.service.start(f.course.id,f.user.id,f.body());f.override({ResultCode:'200',TransactionID:p.providerId,TransactionStatus:'Pending',TransactionCode:'0'})
 await f.service.check(p.id,f.user);await f.service.check(p.id,f.user);assert.equal(f.calls().statusCalls,1);assert.equal((await f.service.summary(f.course.id,f.user.id)).paidCents,0)
})
test('legacy enrollment is preserved without inventing historical payments',async()=>{
 const f=await fixture();await db.enrollment.create({data:{courseId:f.course.id,userId:f.user.id}})
 const s=await f.service.summary(f.course.id,f.user.id);assert.equal(s.legacyAccess,true);assert.equal(s.paidCents,0);assert.equal(s.canPay,false)
 await assert.rejects(f.service.start(f.course.id,f.user.id,f.body()),/existing enrollment/)
})
test('private/draft/empty/unconfirmed courses reject payments before contacting MegaPay',async()=>{
 for(const patch of [{published:false},{archived:true},{feeConfirmed:false}]){const f=await fixture();await db.course.update({where:{id:f.course.id},data:patch});await assert.rejects(f.service.start(f.course.id,f.user.id,f.body()));assert.equal(f.calls().initiateCalls,0)}
 const f=await fixture();await db.lesson.deleteMany({where:{courseId:f.course.id}});await assert.rejects(f.service.start(f.course.id,f.user.id,f.body()),/Enrollment is not open/)
})
test('unconfirmed fee cannot grant free access; explicit admin-confirmed free fee can',async()=>{
 const f=await fixture();await db.course.update({where:{id:f.course.id},data:{priceCents:0,feeConfirmed:false}})
 await assert.rejects(f.courses.enroll(f.course.id,f.user.id),/not confirmed fees/)
 await f.service.setFee(f.course.id,0);await f.courses.enroll(f.course.id,f.user.id);assert.equal(await db.enrollment.count({where:{courseId:f.course.id}}),1)
})
test('tutors cannot bypass admin fee controls and courses with fee records cannot be deleted',async()=>{
 const f=await fixture();await assert.rejects(f.courses.update(f.course.id,{...f.user,role:'Tutor'},{priceCents:0}),/administrator/)
 await f.service.start(f.course.id,f.user.id,f.body());await assert.rejects(f.courses.remove(f.course.id,{...f.user,role:'Admin'}),/Archive it instead/)
})
test('recovery verifies the provider reference before linking and cannot credit another request',async()=>{
 const f=await fixture();f.unknown();const p=await f.service.start(f.course.id,f.user.id,f.body())
 f.override({ResultCode:'200',TransactionID:'RECOVERED',TransactionStatus:'Completed',TransactionCode:'0',TransactionReceipt:'RECOVERY123',TransactionAmount:50,Msisdn:'0712345678',TransactionReference:'WRONG'})
 await assert.rejects(f.service.recover(p.id,'RECOVERED'),/does not match/)
 f.override({ResultCode:'200',TransactionID:'RECOVERED',TransactionStatus:'Completed',TransactionCode:'0',TransactionReceipt:'RECOVERY123',TransactionAmount:50,Msisdn:'0712345678',TransactionReference:p.id})
 const result=await f.service.recover(p.id,'RECOVERED');assert.equal(result.status,'Succeeded');assert.equal((await f.service.summary(f.course.id,f.user.id)).enrolled,true)
 await assert.rejects(f.service.recover(p.id,'RECOVERED'),/Only an unresolved/)
})
