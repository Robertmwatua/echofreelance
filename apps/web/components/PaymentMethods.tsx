import {ReactNode,useId,useState} from 'react'

export function PaymentMethods({children}:{children:ReactNode}) {
 const [method,setMethod]=useState<'mpesa'|'card'>('mpesa')
 const id=useId()
 return <section className="ef-checkout mt-8" aria-label="Payment methods">
   <div className="flex flex-wrap items-end justify-between gap-3"><div><p className="ef-section-label">Checkout / your way to pay</p><h3 className="mt-3 text-2xl">Choose a payment method.</h3></div><span className="ef-meta">Tuition / KES</span></div>
   <div className="ef-payment-methods mt-5" role="group" aria-label="Choose payment method">
    <button type="button" aria-pressed={method==='mpesa'} aria-controls={`${id}-content`} className="ef-payment-method" onClick={()=>setMethod('mpesa')}><span className="ef-payment-method-top"><strong>M-Pesa</strong><span className="ef-payment-choice" aria-hidden="true">{method==='mpesa'?'●':'○'}</span></span><span className="ef-meta">Approve on your phone</span></button>
    <button type="button" aria-pressed={method==='card'} aria-controls={`${id}-content`} className="ef-payment-method" onClick={()=>setMethod('card')}><span className="ef-payment-method-top"><strong>Debit / credit card</strong><span className="ef-payment-choice" aria-hidden="true">{method==='card'?'●':'○'}</span></span><span className="ef-meta">Coming soon / preview</span></button>
   </div>
   <div id={`${id}-content`} className="mt-6">{method==='mpesa'?children:<div className="ef-card-checkout">
    <div className="ef-card-art" aria-label="Illustrative payment card, not a real card"><div className="flex justify-between gap-3"><span className="ef-meta">EchoFreelance / tuition</span><span className="ef-card-stamp">Preview</span></div><svg className="mt-6" width="40" height="30" viewBox="0 0 40 30" fill="none" aria-hidden="true"><rect x="1" y="1" width="38" height="28" rx="4" stroke="currentColor"/><path d="M14 1v28m12-28v28M1 10h13m-13 10h13m12-10h13M26 20h13M14 15h12" stroke="currentColor"/></svg><p className="ef-card-number">•••• &nbsp; •••• &nbsp; •••• &nbsp; ••••</p><div className="flex justify-between gap-4 ef-meta"><span>Your next piece of work.</span><span>MM / YY</span></div></div>
    <div><span className="ef-pill">Card payments / coming soon</span><h4 className="mt-4 text-2xl">A little more choice.<br/>On its way.</h4><p className="ef-muted mt-3 leading-7">Card checkout is not available yet. This is a preview; no card information can be entered or collected here. Use M-Pesa to pay today.</p>
    <fieldset disabled className="ef-card-fields mt-5" aria-label="Card checkout preview — unavailable"><label>Card number<input type="text" placeholder="•••• •••• •••• ••••" autoComplete="off" tabIndex={-1}/></label><div className="grid grid-cols-2 gap-4"><label>Expiry date<input type="text" placeholder="MM / YY" autoComplete="off" tabIndex={-1}/></label><label>Security code<input type="text" placeholder="•••" autoComplete="off" tabIndex={-1}/></label></div><button type="button" className="ef-btn w-full" disabled>Card payments coming soon</button></fieldset>
    <button type="button" className="ef-btn-ghost mt-5" onClick={()=>setMethod('mpesa')}>Use M-Pesa instead →</button></div>
   </div>}</div>
 </section>
}
