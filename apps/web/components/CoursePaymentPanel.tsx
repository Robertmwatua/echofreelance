import Link from 'next/link'
import { FormEvent, useEffect, useRef, useState } from 'react'
import { api, CoursePayment, FeeStatement, formatKes, formatWhen } from '../lib/api'
import { useConfirmation } from './Confirmation'

const active = (p: CoursePayment) => ['Pending','Initiating','Review'].includes(p.status)
export function CoursePaymentPanel({courseId}: {courseId: string}) {
  const [statement,setStatement]=useState<FeeStatement|null>(null)
  const [amount,setAmount]=useState('')
  const [phone,setPhone]=useState('')
  const [busy,setBusy]=useState(false)
  const [error,setError]=useState('')
  const [notice,setNotice]=useState('')
  const [attempt,setAttempt]=useState(0)
  const key=useRef<string|null>(null)
  const requestPayload=useRef<{amountKes:number;phone:string;requestKey:string}|null>(null)
  const {confirm,confirmation}=useConfirmation()
  async function refresh() {const result=await api.feeStatement(courseId);setStatement(result);return result}
  useEffect(()=>{let alive=true;setStatement(null);setError('');key.current=null;requestPayload.current=null;api.feeStatement(courseId).then(r=>{if(alive)setStatement(r)}).catch(e=>{if(alive)setError(e.message)});return()=>{alive=false}},[courseId,attempt])
  const pending=statement?.payments.find(active)
  useEffect(()=>{
    if (!pending || pending.status!=='Pending') return
    let alive=true, timer: ReturnType<typeof setTimeout>, checks=0
    async function poll() {
      try {await api.checkPayment(pending!.id);if(!alive)return;const next=await api.feeStatement(courseId);if(alive)setStatement(next);if(next.payments.find(p=>p.id===pending!.id)?.status!=='Pending')return} catch { /* Manual status check remains available. */ }
      if(alive && ++checks<10) timer=setTimeout(poll,12000)
    }
    timer=setTimeout(poll,12000)
    return()=>{alive=false;clearTimeout(timer)}
  },[pending?.id,pending?.status,courseId])
  async function pay(e: FormEvent) {
    e.preventDefault();if(!statement)return
    const amountKes=Number(amount), cleanPhone=phone.replace(/\s/g,'')
    if(!Number.isInteger(amountKes)||amountKes<1||amountKes>150000||amountKes*100>statement.balanceCents){setError('Enter a whole KES amount up to your balance, maximum KES 150,000.');return}
    if(!/^(?:\+?254|0)[71]\d{8}$/.test(cleanPhone)){setError('Enter a Kenyan M-Pesa number, for example 0712345678.');return}
    if(!await confirm(`Send an M-Pesa payment request for ${formatKes(amountKes*100)} to ${cleanPhone}? Approve it only on your phone. Your first verified instalment unlocks this course.`))return
    setBusy(true);setError('');setNotice('')
    // Keep the same request key and payload after a network error: retry never sends a second STK.
    if(!key.current) key.current=crypto.randomUUID()
    if(!requestPayload.current) requestPayload.current={amountKes,phone:cleanPhone,requestKey:key.current}
    try {const result=await api.startPayment(courseId,requestPayload.current);setNotice(result.detail);key.current=null;requestPayload.current=null;await refresh()} catch(e) {setError(e instanceof Error?e.message:'Could not confirm the payment request. Refresh your statement before retrying.')} finally {setBusy(false)}
  }
  async function check(id:string) {setBusy(true);setError('');try{const result=await api.checkPayment(id);setNotice(result.detail);await refresh()}catch(e){setError(e instanceof Error?e.message:'Could not check payment.')}finally{setBusy(false)}}
  if(!statement)return <section className="ef-panel mt-8" aria-live="polite">{error?<><p role="alert">{error}</p><button className="ef-btn-ghost mt-4" onClick={()=>setAttempt(n=>n+1)}>Reload statement</button></>:<p>Loading your fee statement…</p>}</section>
  return <section className="ef-panel mt-8" aria-labelledby="fee-statement-title"><p className="ef-section-label">KES / course fees</p><h2 id="fee-statement-title" className="mt-3 text-3xl">{statement.title}</h2>
    <dl className="ef-fee-totals mt-6"><div><dt>Total fee</dt><dd>{statement.feeConfirmed?formatKes(statement.totalCents):'Awaiting confirmation'}</dd></div><div><dt>Paid online</dt><dd>{formatKes(statement.paidCents)}</dd></div><div><dt>Balance</dt><dd>{statement.legacyAccess?'Existing enrollment':statement.feeConfirmed?formatKes(statement.balanceCents):'—'}</dd></div></dl>
    {statement.legacyAccess?<p className="ef-toast mt-5">Your existing enrollment is preserved. Historical payments are not recorded here; ask the school about any previous balance.</p>:<p className="ef-muted mt-5">Pay in instalments. Your first verified payment unlocks course access. Your quoted total stays fixed when the school changes its fee for new students.</p>}
    {!statement.configured&&<p role="status" className="ef-toast mt-4">M-Pesa is being connected. Please contact the school before making a payment elsewhere.</p>}
    {!statement.canPay&&!statement.legacyAccess&&statement.balanceCents>0&&statement.configured&&<p className="ef-toast mt-4">Payments open once the school confirms fees and publishes the course with lessons.</p>}
    {statement.enrolled&&<Link className="ef-btn-ghost mt-4 inline-block" href={`/courses/${courseId}`}>Open your course →</Link>}
    {statement.canPay&&!pending&&<form className="mt-7 space-y-5" onSubmit={pay}><div className="grid gap-5 sm:grid-cols-2"><label className="block"><span className="mb-2 block text-sm">Amount to pay (KES)</span><input className="ef-input" required type="number" min="1" max={Math.min(150000,Math.floor(statement.balanceCents/100))} step="1" inputMode="numeric" value={amount} disabled={busy||!!requestPayload.current} onChange={e=>setAmount(e.target.value)}/></label><label className="block"><span className="mb-2 block text-sm">M-Pesa phone number</span><input className="ef-input" required type="tel" autoComplete="tel" placeholder="0712345678" value={phone} disabled={busy||!!requestPayload.current} onChange={e=>setPhone(e.target.value)}/></label></div><p className="ef-meta">Whole KES amounts only. Never enter your M-Pesa PIN on this website.</p><button className="ef-btn" disabled={busy}>{busy?'Sending request…':requestPayload.current?'Recover payment request':'Pay with M-Pesa →'}</button></form>}
    <button type="button" className="ef-btn-ghost mt-5" disabled={busy} onClick={async()=>{setBusy(true);setError('');try{await refresh();key.current=null;requestPayload.current=null}catch(e){setError(e instanceof Error?e.message:'Could not refresh your statement.')}finally{setBusy(false)}}}>Refresh statement</button>
    {pending&&<div className="ef-toast mt-6" role="status"><p>{pending.detail}</p><p className="ef-meta mt-2">Reference: {pending.id}</p><p className="ef-meta mt-2">Please resolve this payment before sending another.</p></div>}
    {error&&<p role="alert" className="ef-text-danger mt-4">{error}</p>}{notice&&<p role="status" className="ef-toast mt-4">{notice}</p>}
    <h3 className="mt-9 text-2xl">Your payment records</h3>{!statement.payments.length?<p className="ef-muted mt-3">No online payments recorded yet.</p>:<ol className="ef-payment-records mt-4">{statement.payments.map(p=><li className="border-t border-line py-5" key={p.id}><div className="flex flex-wrap justify-between gap-3"><strong>{formatKes(p.amountCents)}</strong><span className="ef-pill">{p.status==='Succeeded'?'Paid':p.status}</span></div><p className="ef-meta mt-3">{formatWhen(p.createdAt)} · {p.phone}</p><p className="ef-muted mt-2">{p.detail}</p><p className="ef-meta mt-2 break-all">Reference: {p.id}{p.receipt?` · M-Pesa receipt: ${p.receipt}`:''}</p>{p.status==='Pending'&&<button type="button" disabled={busy} className="ef-btn-ghost mt-3" onClick={()=>check(p.id)}>Check payment status</button>}{['Initiating','Review'].includes(p.status)&&<a className="ef-btn-ghost mt-3 inline-block" href={`mailto:ecofreelancetechnologyplus@gmail.com?subject=${encodeURIComponent('Payment help: '+p.id)}`}>Ask the school to review →</a>}</li>)}</ol>}{confirmation}
  </section>
}
