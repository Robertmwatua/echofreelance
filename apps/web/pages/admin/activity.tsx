import {Button,NavigationLink} from '../../components/Button'
import {useEffect,useState} from 'react'
import Link from 'next/link'
import {AdminWorkspace} from '../../components/AdminWorkspace'
import {RequireRole} from '../../components/RequireRole'
import {DataTable} from '../../components/admin/DataTable'
import {admin,Activity} from '../../lib/admin-api'
import {formatWhen} from '../../lib/api'
export default function ActivityPage(){return <RequireRole roles={['Admin']}>{()=> <Desk/>}</RequireRole>}
function Desk(){const [rows,setRows]=useState<Activity[]>([]),[offset,setOffset]=useState(0),[more,setMore]=useState(false),[error,setError]=useState('');useEffect(()=>{admin.activity(offset).then(r=>{setRows(r.items);setMore(r.hasMore)}).catch(e=>setError(e.message))},[offset]);return <AdminWorkspace title="Recent activity" description="Enrolments, confirmed payments and posts, derived from current records. This is not a complete audit log.">{error&&<p role="alert">{error}</p>}<DataTable name="activity" rows={rows} date={r=>r.at} status={r=>r.action} columns={[{key:'who',title:'Person',value:r=>r.who},{key:'action',title:'Action',value:r=>r.action},{key:'detail',title:'Details',value:r=>r.detail,render:r=><NavigationLink href={r.href} className="ef-btn-ghost">{r.detail} →</NavigationLink>},{key:'time',title:'When',value:r=>r.at,render:r=>formatWhen(r.at)}]}/><div className="flex gap-5 mt-6"><Button className="admin-secondary" disabled={!offset} onClick={()=>setOffset(n=>Math.max(0,n-40))}>Earlier page</Button><Button className="admin-secondary" disabled={!more||offset>=960} onClick={()=>setOffset(n=>n+40)}>Older activity</Button></div></AdminWorkspace>}
