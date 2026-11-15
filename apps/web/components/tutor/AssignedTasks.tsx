import {useEffect,useState} from 'react'
import {formatWhen} from '../../lib/api'
import {school,Task} from '../../lib/school-api'
export function AssignedTasks(){const [tasks,setTasks]=useState<Task[]>([]),[error,setError]=useState(''),[busy,setBusy]=useState(false)
 useEffect(()=>{school.myTasks().then(setTasks).catch(()=>{})},[])
 if(!tasks.length&&!error)return null
 return <section className="ef-panel mt-8"><p className="ef-section-label">Shared plan / assigned to you</p><h2 className="mt-3 text-2xl">The next things to handle.</h2>{error&&<p role="alert" className="ef-toast mt-4">{error}</p>}<ul className="mt-5 space-y-5">{tasks.map(t=><li key={t.id}><p className="ef-meta">Due {formatWhen(t.dueAt)}</p><h3 className="mt-2 text-xl">{t.title}</h3><p className="ef-readable-copy mt-2">{t.details}</p><button className="ef-btn-ghost mt-3" disabled={busy} onClick={async()=>{setBusy(true);setError('');try{await school.completeTask(t.id);setTasks(rows=>rows.filter(x=>x.id!==t.id))}catch(e){setError(e instanceof Error?e.message:'Could not complete task.')}finally{setBusy(false)}}}>Mark done</button></li>)}</ul></section>
}
