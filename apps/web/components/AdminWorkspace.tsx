import {Button} from './Button'
import Link from 'next/link'
import {useRouter} from 'next/router'
import {ReactNode} from 'react'
import DocumentHead from './DocumentHead'
import {PageHeader} from './admin/Workspace'
export function AdminWorkspace({title,description,children}:{title:string;description:string;children:ReactNode}){
 const router=useRouter()
 return <><DocumentHead title={`${title} — Admin`}/><main className="admin-workspace"><PageHeader title={title} description={description}/><nav aria-label="School management" className="ef-workspace-nav mt-7">{[['/admin','Overview'],['/admin/planner','Planner'],['/admin/enquiries','Admissions'],['/admin/careers','Careers'],['/admin/payments','Fees & payments'],['/admin/reconciliation','Follow-ups'],['/admin/courses','Courses'],['/admin/people','People'],['/admin/classes','Classes']].map(([href,label])=><Link key={href} href={href} aria-current={router.pathname===href?'page':undefined}>{label}</Link>)}</nav>{children}</main></>
}
export function Pager({offset,total,size=30,busy,change}:{offset:number;total:number;size?:number;busy:boolean;change:(n:number)=>void}){return <div className="mt-6 flex flex-wrap items-center gap-5"><Button className="ef-btn-ghost" disabled={!offset||busy} onClick={()=>change(Math.max(0,offset-size))}>← Previous</Button><span className="ef-meta">{total?`${offset+1}–${Math.min(offset+size,total)} of ${total}`:'No records'}</span><Button className="ef-btn-ghost" disabled={offset+size>=total||busy} onClick={()=>change(offset+size)}>Next →</Button></div>}
