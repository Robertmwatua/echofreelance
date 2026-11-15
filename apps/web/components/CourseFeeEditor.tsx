import { FormEvent, useEffect, useState } from 'react'
import { api, Course, formatPrice, getStoredUser } from '../lib/api'
import { useConfirmation } from './Confirmation'

export function CourseFeeEditor({course, updated}: {course: Course; updated: () => Promise<void>}) {
  const [admin,setAdmin] = useState(false)
  const [amount,setAmount] = useState('')
  const [busy,setBusy] = useState(false)
  const [notice,setNotice] = useState('')
  const {confirm,confirmation} = useConfirmation()
  useEffect(() => { setAdmin(getStoredUser()?.role === 'Admin'); setAmount(course.feeConfirmed ? String(course.priceCents/100) : '') },[course.id,course.priceCents,course.feeConfirmed])
  async function save(e: FormEvent) {
    e.preventDefault()
    const value = Number(amount)
    if (!amount.trim() || !Number.isInteger(value) || value<0 || value>1000000) {setNotice('Enter a whole KES amount from 0 to 1,000,000.');return}
    if (!await confirm(`Confirm ${value === 0 ? 'a free course' : formatPrice(value*100)} as the total school fee for ${course.title}? Existing student quotes and course access will stay unchanged.`)) return
    setBusy(true);setNotice('')
    try {const result=await api.setCourseFee(course.id,value);await updated();setNotice(result.message)} catch(e) {setNotice(e instanceof Error?e.message:'Could not save the fee.')} finally {setBusy(false)}
  }
  if(!admin) return null
  return <section className="ef-panel mt-6" aria-labelledby="fee-editor-title"><p className="ef-section-label">Admin / school fees</p><h2 id="fee-editor-title" className="mt-3 text-2xl">Set the fee. Keep it clear.</h2><p className="ef-muted mt-3">{course.feeConfirmed?`Current total: ${formatPrice(course.priceCents)}.`:'No confirmed fee yet. Payments are disabled.'} Students choose an instalment amount; their first verified payment unlocks access.</p><form onSubmit={save} className="mt-5 space-y-4"><label className="block text-sm"><span className="mb-2 block">Total course fee (KES)</span><input className="ef-input" type="number" inputMode="numeric" min="0" max="1000000" step="1" required value={amount} onChange={e=>setAmount(e.target.value)} disabled={busy}/></label><p className="ef-meta">0 explicitly makes this course free. Fee changes apply to new student quotes only.</p><button className="ef-btn" disabled={busy}>{busy?'Saving…':'Confirm school fee'}</button></form>{notice&&<p className="ef-toast mt-4" role="status">{notice}</p>}{confirmation}</section>
}
