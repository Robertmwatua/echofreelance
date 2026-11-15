import {NavigationLink} from './Button'
import Link from 'next/link'
import {PaymentReference} from './PaymentReference'
import {Button} from './Button'
import {StudentGroup} from './StudentGroup'
import {PaymentMethods} from './PaymentMethods'
import { FormEvent, useEffect, useRef, useState } from 'react'
import { api, CoursePayment, FeeStatement, downloadReceipt, formatKes, formatWhen } from '../lib/api'
import { useConfirmation } from './Confirmation'

const active = (p: CoursePayment) => ['Pending','Initiating','Review'].includes(p.status)
export function CoursePaymentPanel({courseId}: {courseId: string}) {
  const [statement,setStatement]=useState<FeeStatement|null>(null)
  const [amount,setAmount]=useState('')
  const [phone,setPhone]=useState('')
  const [busy,setBusy]=useState(false)
  const [error,setError]=useState('')
  const [refreshing,setRefreshing]=useState(false)
  const [notice,setNotice]=useState('')
  const [attempt,setAttempt]=useState(0)
  const key=useRef<string|null>(null)
  const requestPayload=useRef<{amountKes:number;phone:string;requestKey:string;quotedTotalCents:number;quotedDepositCents:number}|null>(null)
  const {confirm,confirmation}=useConfirmation()
  async function refresh() {const result=await api.feeStatement(courseId);setStatement(result);return result}
  useEffect(()=>{let alive=true;setStatement(null);setError('');key.current=null;requestPayload.current=null;api.feeStatement(courseId).then(r=>{if(alive)setStatement(r)}).catch(e=>{if(alive)setError(e.message)});return()=>{alive=false}},[courseId,attempt])
  const pending=statement?.payments.find(active)
  const failed=statement?.payments.find(p=>p.status==='Failed')
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
    if(!Number.isInteger(amountKes)||amountKes*100<(statement.minPaymentCents??100)||amountKes>150000||amountKes*100>statement.balanceCents){setError(`Enter at least ${formatKes(statement.minPaymentCents??100)}, up to your balance (maximum KES 150,000 per payment).`);return}
    if(!/^(?:\+?254|0)[71]\d{8}$/.test(cleanPhone)){setError('Enter a Kenyan M-Pesa number, for example 0712345678.');return}
    if(!await confirm(`Send an M-Pesa payment request for ${formatKes(amountKes*100)} to ${cleanPhone}? Approve it only on your phone. Access unlocks after your quoted deposit has been verified.`))return
    setBusy(true);setError('');setNotice('')
    // Keep the same request key and payload after a network error: retry never sends a second STK.
    if(!key.current) key.current=crypto.randomUUID()
    if(!requestPayload.current) requestPayload.current={amountKes,phone:cleanPhone,requestKey:key.current,quotedTotalCents:statement.totalCents,quotedDepositCents:statement.unlockCents}
    try {const result=await api.startPayment(courseId,requestPayload.current);setNotice(result.detail);key.current=null;requestPayload.current=null;await refresh()} catch(e) {setError(e instanceof Error?e.message:'Could not confirm the payment request. Refresh your statement before retrying.')} finally {setBusy(false)}
  }
  async function check(id:string) {setBusy(true);setError('');try{const result=await api.checkPayment(id);setNotice(result.detail);await refresh()}catch(e){setError(e instanceof Error?e.message:'Could not check payment.')}finally{setBusy(false)}}
  if(!statement)return <section className="ef-panel mt-8" aria-live="polite">{error?<><p role="alert">{error}</p><Button className="ef-btn-ghost mt-4" onClick={()=>setAttempt(n=>n+1)}>Reload statement</Button></>:<p>Loading your fee statement…</p>}</section>
  return <section className="ef-panel mt-8" aria-labelledby="fee-statement-title"><p className="ef-section-label">KES / course fees</p><h2 id="fee-statement-title" className="mt-3 text-3xl">{statement.title}</h2>
    <dl className="ef-fee-totals mt-6"><div><dt>Total fee</dt><dd>{statement.feeConfirmed?formatKes(statement.totalCents):'Awaiting confirmation'}</dd></div><div><dt>Paid online</dt><dd>{formatKes(statement.paidCents)}</dd></div><div><dt>Balance</dt><dd>{statement.legacyAccess?'Existing enrollment':statement.feeConfirmed?formatKes(statement.balanceCents):'—'}</dd></div></dl>
    {statement.legacyAccess?<p className="ef-toast mt-5">Your existing enrollment is preserved. Historical payments are not recorded here; ask the school about any previous balance.</p>:<p className="ef-muted mt-5">Pay in instalments. Your quoted total and access deposit stay fixed when the school changes fees or discounts for new students.</p>}
    {!statement.legacyAccess&&<div className="ef-toast mt-4"><p>{statement.enrolled?'Your access deposit is complete.':`${formatKes(statement.unlockRemainingCents??statement.unlockCents??0)} still needed to unlock lessons.`}</p><p className="ef-meta mt-2">Quoted access deposit: {formatKes(statement.unlockCents||0)}{statement.depositPercent?` (${statement.depositPercent}%)`:''}.{statement.discountPercent?` Tuition discount: ${statement.discountPercent}%.`:''}</p></div>}
    {!!(statement.registrationFeeCents||statement.certificationFeeCents)&&<p className="ef-meta mt-4">Separate school charges: registration {formatKes(statement.registrationFeeCents||0)} and certification {formatKes(statement.certificationFeeCents||0)}. These are not included in this tuition payment.</p>}
    {!statement.configured&&<p role="status" className="ef-toast mt-4">M-Pesa is being connected. Please contact the school before making a payment elsewhere.</p>}
    {!statement.canPay&&!statement.legacyAccess&&statement.balanceCents>0&&statement.configured&&<p className="ef-toast mt-4">Payments open once the school confirms fees and publishes the course with lessons.</p>}
    {statement.enrolled&&<NavigationLink className="ef-btn-ghost mt-4 inline-block" href={`/courses/${courseId}`}>Open your course →</NavigationLink>}
    <PaymentMethods>{statement.canPay&&!pending?<form className="mt-7 space-y-5" onSubmit={pay}><div className="flex flex-wrap gap-5"><Button type="button" className="ef-btn-ghost" disabled={busy||!!requestPayload.current} onClick={()=>setAmount(String(Math.min(statement.balanceCents,statement.minPaymentCents??100)/100))}>Use minimum amount</Button><Button type="button" className="ef-btn-ghost" disabled={busy||!!requestPayload.current} onClick={()=>setAmount(String(Math.min(statement.balanceCents,15000000)/100))}>{statement.balanceCents>15000000?'Use KES 150,000 limit':'Pay full remaining balance'}</Button></div><div className="grid gap-5 sm:grid-cols-2"><label className="block"><span className="mb-2 block text-sm">Amount to pay (KES)</span><input className="ef-input" required type="number" min={Math.max(1,(statement.minPaymentCents??100)/100)} max={Math.min(150000,Math.floor(statement.balanceCents/100))} step="1" inputMode="numeric" value={amount} disabled={busy||!!requestPayload.current} onChange={e=>setAmount(e.target.value)}/></label><label className="block"><span className="mb-2 block text-sm">M-Pesa phone number</span><input className="ef-input" required type="tel" autoComplete="tel" placeholder="0712345678" value={phone} disabled={busy||!!requestPayload.current} onChange={e=>setPhone(e.target.value)}/></label></div><p className="ef-meta">Whole KES amounts only. Never enter your M-Pesa PIN on this website.</p><Button className="ef-btn" loading={busy} loadingLabel="Processing…" disabled={busy}>{busy?'Sending request…':requestPayload.current?'Recover payment request':'Pay with M-Pesa →'}</Button></form>:<p className="ef-muted">{pending?'Resolve your existing payment below before starting another.':statement.balanceCents===0?'There is no outstanding tuition to pay.':'Choose an eligible course with confirmed fees to pay by M-Pesa.'}</p>}</PaymentMethods>
    <Button type="button" className="mt-5" loading={refreshing} loadingLabel="Refreshing…" disabled={busy} onClick={async()=>{setBusy(true);setRefreshing(true);setError('');try{await refresh();key.current=null;requestPayload.current=null}catch(e){setError(e instanceof Error?e.message:'Could not refresh your statement.')}finally{setBusy(false);setRefreshing(false)}}}>↻ Refresh statement</Button>
    {(pending||failed)&&<div className="ef-payment-alert mt-6" role="status"><strong>{pending?'◷ Payment in progress':'! Payment not confirmed'}</strong><p>{pending?pending.detail:failed!.detail}</p><PaymentReference value={(pending||failed)!.id}/>{pending&&<><ol className="ef-payment-timeline" aria-label="Payment status"><li>● Request sent</li><li>○ Awaiting verification</li><li>○ Receipt pending</li></ol><p className="ef-meta">A delay is not proof of failure. Resolve this request before sending another.</p>{pending.status==='Pending'&&<Button type="button" disabled={busy} onClick={()=>check(pending.id)}>Check payment status</Button>}</>}</div>}
    {error&&<p role="alert" className="ef-text-danger mt-4">{error}</p>}{notice&&!pending&&!failed&&<p role="status" className="ef-toast mt-4">{notice}</p>}
    {statement.enrolled&&statement.paidCents>0&&<StudentGroup courseId={courseId}/>}
    <h3 className="mt-9 text-2xl">Your payment records</h3>{!statement.payments.length?<p className="ef-muted mt-3">No online payments recorded yet.</p>:<ol className="ef-payment-records mt-4">{statement.payments.map(p=><li className="ef-payment-record" key={p.id}><div className="ef-payment-record-main"><div className="flex flex-wrap gap-4 items-center"><strong>{formatKes(p.amountCents)}</strong><span className="ef-pill">{p.status==='Succeeded'?'✓ Paid':p.status==='Failed'?'! Failed':`◷ ${p.status}`}</span></div><p className="ef-meta mt-3">{formatWhen(p.createdAt)} · M-Pesa {p.phone}</p><div className="mt-3"><PaymentReference value={p.id}/></div>{p.receipt&&<p className="ef-meta mt-3">M-Pesa receipt: {p.receipt}</p>}{p.status==='Succeeded'&&<ol className="ef-payment-timeline" aria-label="Payment status"><li>✓ Sent</li><li>✓ Confirmed</li><li>✓ Receipted</li></ol>}</div><div className="ef-payment-record-actions">{p.status==='Succeeded'&&<Button type="button" disabled={busy} onClick={async()=>{setBusy(true);setError('');try{await downloadReceipt(p.id)}catch(e){setError(e instanceof Error?e.message:'Receipt download failed.')}finally{setBusy(false)}}}>Download receipt (PDF) ↓</Button>}{['Failed','Initiating','Review'].includes(p.status)&&<Button type="button" onClick={()=>{window.location.href=`mailto:ecofreelancetechnologyplus@gmail.com?subject=${encodeURIComponent('Payment help: '+p.id)}`}}>Ask the school to review</Button>}</div></li>)}</ol>}<footer className="ef-payment-footer"><NavigationLink className="ef-btn-ghost" href="/fees">All fee statements →</NavigationLink><NavigationLink className="ef-btn-ghost" href={`/courses/${courseId}`}>Back to course →</NavigationLink></footer>{confirmation}
  </section>
}
