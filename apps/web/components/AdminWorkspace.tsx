import {Button} from './Button'
import Link from 'next/link'
import {useRouter} from 'next/router'
import {ReactNode} from 'react'
import DocumentHead from './DocumentHead'
import {PageHeader} from './admin/Workspace'

const TABS:Array<[string,string]>=[
 ['/admin','Overview'],['/admin/planner','Planner'],['/admin/enquiries','Admissions'],
 ['/admin/careers','Careers'],['/admin/payments','Fees & payments'],['/admin/reconciliation','Follow-ups'],
 ['/admin/courses','Courses'],['/admin/people','People'],['/admin/classes','Classes'],
]

/** Counts of items waiting on each tab, keyed by href. Shown only when above zero. */
export type TabCounts=Partial<Record<string,number>>

export function AdminWorkspace({title,description,note,actions,counts,children}:{
 title:string;description:string;note?:ReactNode;actions?:ReactNode;counts?:TabCounts;children:ReactNode
}){
 const router=useRouter()
 return <><DocumentHead title={`${title} — Admin`}/><main className="admin-workspace">
  <PageHeader title={title} description={description} note={note} actions={actions}/>
  <nav aria-label="School management" className="ef-workspace-nav">
   {TABS.map(([href,label])=>{
    const count=counts?.[href]
    return <Link key={href} href={href} aria-current={router.pathname===href?'page':undefined}>
     {label}
     {!!count&&<span className="admin-tab-count" data-attention={href==='/admin/reconciliation'||href==='/admin/enquiries'}>{count}</span>}
    </Link>
   })}
  </nav>
  {children}
 </main></>
}

export function Pager({offset,total,size=30,busy,change}:{offset:number;total:number;size?:number;busy:boolean;change:(n:number)=>void}){
 return <div className="mt-6 flex flex-wrap items-center gap-4">
  <Button className="adm-button-secondary" disabled={!offset||busy} onClick={()=>change(Math.max(0,offset-size))}>Previous</Button>
  <span className="ef-meta">{total?`${offset+1}–${Math.min(offset+size,total)} of ${total}`:'No records'}</span>
  <Button className="adm-button-secondary" disabled={offset+size>=total||busy} onClick={()=>change(offset+size)}>Next</Button>
 </div>
}
