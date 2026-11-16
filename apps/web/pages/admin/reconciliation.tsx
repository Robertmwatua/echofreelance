import {useRouter} from 'next/router'
import Link from 'next/link'
import {useCallback,useEffect,useMemo,useState} from 'react'
import {AdminWorkspace,Pager} from '../../components/AdminWorkspace'
import {RequireRole} from '../../components/RequireRole'
import {CopyableId,DataRow,EmptyState,ErrorState,RefreshButton,RowSkeleton,SegmentedFilter,Stamp,StatBlock,StatusBadge} from '../../components/admin/ui'
import {age,money,waited,when} from '../../lib/adminFormat'
import {api} from '../../lib/api'

type Account=Awaited<ReturnType<typeof api.reconciliation>>['items'][number]

export default function Reconciliation(){return <RequireRole roles={['Admin']}>{()=> <Desk/>}</RequireRole>}

function Desk(){
 const router=useRouter()
 const [data,setData]=useState<Awaited<ReturnType<typeof api.reconciliation>>|null>(null)
 const [offset,setOffset]=useState(0),[filter,setFilter]=useState('All')
 const [busy,setBusy]=useState(true),[error,setError]=useState(''),[updatedAt,setUpdatedAt]=useState('')

 const load=useCallback(async()=>{
  setBusy(true);setError('')
  try{setData(await api.reconciliation(offset));setUpdatedAt(when(new Date()).split(', ')[1]||'')}
  catch(e){setError(e instanceof Error?e.message:'Could not load follow-ups.')}
  finally{setBusy(false)}
 },[offset])
 useEffect(()=>{void load()},[load])
 useEffect(()=>{if(router.query.filter==='Balance')setFilter('Outstanding')},[router.query.filter])

 const all=useMemo(()=>data?.items||[],[data])
 const counts={
  All:all.length,
  Outstanding:all.filter(a=>a.balanceCents>0).length,
  Delayed:all.filter(a=>a.delayed.length>0).length,
 }
 // Longest waiting first: the oldest unconfirmed request is the one that needs a person.
 const items=useMemo(()=>{
  const picked=all.filter(a=>filter==='All'||(filter==='Delayed'?a.delayed.length>0:a.balanceCents>0))
  const oldest=(a:Account)=>a.delayed.reduce((n,p)=>Math.min(n,new Date(p.createdAt).getTime()),Infinity)
  return [...picked].sort((a,b)=>oldest(a)-oldest(b))
 },[all,filter])
 const outstanding=items.reduce((n,a)=>n+a.balanceCents,0)

 return <AdminWorkspace
   title="Follow-ups"
   description="Tuition balances and payment requests waiting more than 15 minutes."
   note="No automatic collection or reminder messages are sent."
   counts={{'/admin/reconciliation':counts.Delayed}}
   actions={<Link className="adm-button-primary" href="/admin/payments">Open payment ledger</Link>}>

  <div className="adm-toolbar">
   <SegmentedFilter label="Show" value={filter} onChange={setFilter} options={[
    {value:'All',label:'All',count:counts.All},
    {value:'Outstanding',label:'Tuition balances',count:counts.Outstanding},
    {value:'Delayed',label:'Awaiting confirmation',count:counts.Delayed},
   ]}/>
   <div className="adm-toolbar-end"><RefreshButton busy={busy} onClick={()=>void load()} updatedAt={updatedAt}/></div>
  </div>

  <p className="adm-row-summary" role="status" aria-live="polite">
   {busy?'Loading follow-ups…':<><strong>{items.length}</strong> item{items.length===1?'':'s'} · <strong>{money(outstanding)}</strong> outstanding</>}
  </p>

  {error?<ErrorState message={error} onRetry={()=>void load()}/>
   :busy?<RowSkeleton count={4}/>
   :items.length===0?<EmptyState title="All caught up. Nothing is waiting for confirmation."
      action={<button type="button" className="adm-button-secondary" onClick={()=>void load()}>Refresh</button>}>
      Accounts without an online fee quote are not given invented balances.
     </EmptyState>
   :<ul className="adm-rows">{items.map(a=><Follow key={a.id} account={a}/>)}</ul>}

  <Pager offset={offset} total={data?.total||0} busy={busy} change={setOffset}/>
 </AdminWorkspace>
}

function Follow({account:a}:{account:Account}){
 const first=a.delayed[0]
 const draft=`mailto:${encodeURIComponent(a.user.email)}?subject=${encodeURIComponent('Your tuition statement: '+a.course.title)}&body=${encodeURIComponent(`Hello, your quoted tuition is ${money(a.totalCents)}, with ${money(a.paidCents)} confirmed and ${money(a.balanceCents)} remaining. Please sign in to view your fee statement. If a payment is awaiting confirmation, do not pay again until it has been reviewed.`)}`
 return <DataRow summary={<>
   <span className="adm-row-person">
    <span className="adm-row-name">{a.user.name||'Student account'}</span>
    <span className="adm-row-email">{a.user.email}</span>
   </span>
   <span className="adm-course-tag">{a.course.title}</span>
   <span className="adm-row-signal">
    {first&&<StatusBadge tone="caution">Needs confirmation</StatusBadge>}
    {first&&<span className="adm-row-waiting">{waited(first.createdAt)}<span>Waiting</span></span>}
    <span className={`adm-row-amount ${a.balanceCents>0?'is-due':''}`}>{money(a.balanceCents)}</span>
   </span>
  </>}>

  <div className="adm-stats">
   <StatBlock label="Quoted fee" value={money(a.totalCents)}/>
   <StatBlock label="Paid" value={money(a.paidCents)}/>
   <StatBlock label="Balance" value={money(a.balanceCents)} alert/>
  </div>

  {/* TODO(data): unlockRemainingCents comes from CourseFeeAccount.unlockCents, whose schema
      default is 100 (KES 1). Courses that never had a deposit configured therefore read
      "KES 1 still needed" against a far larger balance. Reported, not changed here. */}
  <div className="adm-field">
   <span className="adm-field-label">Access deposit</span>
   <span className="adm-field-value">{a.unlockRemainingCents?`${money(a.unlockRemainingCents)} still needed`:'Reached'}</span>
  </div>

  {a.delayed.map(p=><div className="adm-request" key={p.id}>
   <StatusBadge tone="caution">{p.status}</StatusBadge>
   <Stamp iso={p.createdAt}>{when(p.createdAt)}</Stamp>
   <span>· {age(p.createdAt)}</span>
   <CopyableId value={p.id} label="payment reference"/>
  </div>)}

  <div className="adm-row-actions">
   <a className="adm-button-primary" href={draft}>Draft follow-up email</a>
   <Link className="adm-button-secondary" href="/admin/payments">Open payment ledger</Link>
  </div>
 </DataRow>
}
