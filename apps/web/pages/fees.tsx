import Link from 'next/link'
import { useRouter } from 'next/router'
import { useEffect, useState } from 'react'
import DocumentHead from '../components/DocumentHead'
import { RequireRole } from '../components/RequireRole'
import { CoursePaymentPanel } from '../components/CoursePaymentPanel'
import { api, FeeStatement, formatKes } from '../lib/api'
export default function FeesPage() {return <RequireRole roles={['Student','Tutor','Admin']}>{()=> <Fees/>}</RequireRole>}
function Fees() {
  const router=useRouter(), id=typeof router.query.course==='string'?router.query.course:''
  const [accounts,setAccounts]=useState<FeeStatement[]>([]), [error,setError]=useState(''),[loading,setLoading]=useState(true)
  useEffect(()=>{api.myFees().then(setAccounts).catch(e=>setError(e.message)).finally(()=>setLoading(false))},[id])
  return <><DocumentHead title="Fees & payments — EchoFreelance"/><main className="ef-page"><p className="ef-section-label">Account / fees & receipts</p><h1 className="ef-title mt-4">One step at a time.</h1><p className="ef-muted mt-5 max-w-2xl">Choose what to pay towards your course. Keep track of every confirmed instalment here.</p>{id&&<><CoursePaymentPanel key={id} courseId={id}/><Link className="ef-btn-ghost mt-6 inline-block" href="/fees">All fee statements →</Link></>}{!id&&<section className="mt-12"><h2 className="text-2xl">Your fee statements</h2>{error&&<p role="alert" className="ef-toast mt-4">{error}</p>}{loading?<p role="status" className="ef-meta mt-4">Loading statements…</p>:!accounts.length?<div className="ef-panel mt-4"><p>No fee statements yet. Pick a course to get started.</p><Link href="/courses" className="ef-btn-ghost mt-4 inline-block">Explore courses →</Link></div>:<ul className="ef-fee-list mt-5">{accounts.map(a=><li key={a.courseId} className="ef-panel"><h3 className="text-xl">{a.title}</h3><p className="ef-meta mt-3">Paid {formatKes(a.paidCents)} · Balance {formatKes(a.balanceCents)}</p><Link className="ef-btn-ghost mt-4 inline-block" href={`/fees?course=${encodeURIComponent(a.courseId)}`}>View statement & pay →</Link></li>)}</ul>}</section>}</main></>}
