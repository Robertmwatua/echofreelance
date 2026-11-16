// Run against the disposable local learning QA API, never production.
const assert=require('node:assert/strict')
const base=process.env.HOMEPAGE_QA_API
if(base!=='http://127.0.0.1:4011/api')throw Error('Set HOMEPAGE_QA_API to the disposable local QA API')
async function request(path,method='GET',body,token){const r=await fetch(base+path,{method,headers:{'Content-Type':'application/json',...(token?{Authorization:'Bearer '+token}:{})},body:body?JSON.stringify(body):undefined});return {status:r.status,data:await r.json()}}
async function main(){
 const admin=(await request('/auth/login','POST',{email:'qa-admin@example.invalid',password:'learning-qa-only-2026'})).data.accessToken
 const student=(await request('/auth/login','POST',{email:'qa-student@example.invalid',password:'learning-qa-only-2026'})).data.accessToken
 const tutor=(await request('/auth/login','POST',{email:'qa-tutor@example.invalid',password:'learning-qa-only-2026'})).data.accessToken
 assert.ok(admin&&student&&tutor)
 const original=(await request('/courses/homepage-selection','GET',undefined,admin)).data.courseIds
 const save=ids=>request('/courses/homepage-selection','PATCH',{courseIds:ids},admin)
 try{
 assert.equal((await request('/courses/homepage-selection','PATCH',{courseIds:[]})).status,401)
 for(const token of [student,tutor]){assert.equal((await request('/courses/homepage-selection','GET',undefined,token)).status,403);assert.equal((await request('/courses/homepage-selection','PATCH',{courseIds:[]},token)).status,403)}
 assert.equal((await save(['qa-learning-2','qa-learning-0'])).status,200)
 assert.deepEqual((await request('/courses/homepage')).data.map(c=>c.id),['qa-learning-2','qa-learning-0'])
 assert.deepEqual((await request('/courses/homepage-selection','GET',undefined,admin)).data.courseIds,['qa-learning-2','qa-learning-0'])
 for(const ids of [['qa-learning-0','qa-learning-0'],['qa-learning-0','qa-learning-1','qa-learning-2','qa-learning-3'],['qa-learning-3'],['missing']])assert.equal((await save(ids)).status,400)
 assert.deepEqual((await request('/courses/homepage-selection','GET',undefined,admin)).data.courseIds,['qa-learning-2','qa-learning-0'])
 assert.equal((await request('/courses/qa-learning-0','PATCH',{published:false},admin)).status,200)
 assert.deepEqual((await request('/courses/homepage')).data.map(c=>c.id),['qa-learning-2'])
 assert.equal((await save([])).status,200)
 assert.deepEqual((await request('/courses/homepage')).data,[])
 console.log('PASS: admin-only selection, ordered persistence, limit/duplicate/private validation, atomic failures, unpublished filtering, and explicit empty selection')
 }finally{assert.equal((await request('/courses/qa-learning-0','PATCH',{published:true},admin)).status,200);assert.equal((await save(original)).status,200)}
}
main().catch(e=>{console.error(e);process.exitCode=1})
