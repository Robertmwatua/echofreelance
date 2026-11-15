import {NavigationLink} from '../../components/Button'
import {useEffect,useState} from 'react'
import Link from 'next/link'
import {AdminWorkspace} from '../../components/AdminWorkspace'
import {RequireRole} from '../../components/RequireRole'
import {DataTable} from '../../components/admin/DataTable'
import {admin} from '../../lib/admin-api'
import {formatWhen} from '../../lib/api'
export default function Community(){return <RequireRole roles={['Admin']}>{()=> <Desk/>}</RequireRole>}
function Desk(){const [rows,setRows]=useState<Awaited<ReturnType<typeof admin.community>>>([]),[error,setError]=useState('');useEffect(()=>{admin.community().then(setRows).catch(e=>setError(e.message))},[]);return <AdminWorkspace title="Community review" description="Read the latest 500 course posts and open the conversation. Reporting and a flag queue are not configured.">{error&&<p role="alert">{error}</p>}<DataTable name="community" rows={rows} course={r=>r.course.title} date={r=>r.createdAt} columns={[{key:'author',title:'Author',value:r=>r.author.name||r.author.email},{key:'body',title:'Post',value:r=>r.body},{key:'course',title:'Course',value:r=>r.course.title,render:r=><NavigationLink href={`/discussions?course=${r.course.id}`} className="ef-btn-ghost">{r.course.title} →</NavigationLink>},{key:'date',title:'Posted',value:r=>r.createdAt,render:r=>formatWhen(r.createdAt)}]}/></AdminWorkspace>}
