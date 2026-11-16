import {useEffect,useState} from 'react'
import {api,Course} from '../../lib/api'
import {Button} from '../Button'

export function HomepageCourses({courses}:{courses:Course[]}){
 const [ids,setIds]=useState<string[]>([]),[saved,setSaved]=useState<string[]>([]),[loading,setLoading]=useState(true),[busy,setBusy]=useState(false),[error,setError]=useState(''),[message,setMessage]=useState(''),[attempt,setAttempt]=useState(0)
 useEffect(()=>{let active=true;setLoading(true);setError('');api.homepageSelection().then(r=>{if(active){setIds(r.courseIds);setSaved(r.courseIds)}}).catch(e=>{if(active)setError(e.message)}).finally(()=>{if(active)setLoading(false)});return()=>{active=false}},[attempt])
 const eligible=courses.filter(c=>c.published&&!c.archived&&c.title.trim()&&c.description.trim())
 const available=eligible.filter(c=>!ids.includes(c.id)),dirty=JSON.stringify(ids)!==JSON.stringify(saved)
 function change(next:string[]){setIds(next);setMessage('');setError('')}
 function move(index:number,delta:number){const next=[...ids];[next[index],next[index+delta]]=[next[index+delta],next[index]];change(next)}
 return <section className="homepage-picker" aria-labelledby="homepage-picker-title" aria-busy={loading||busy}>
  <header><div><h2 id="homepage-picker-title">Homepage courses</h2><p>Choose up to 3 courses. The first course appears first. Only published courses can be displayed.</p></div><span>{ids.length}/3 selected</span></header>
  {loading?<p role="status">Loading homepage selection…</p>:<>
   <ol>{ids.map((id,index)=>{const c=courses.find(c=>c.id===id),valid=eligible.some(c=>c.id===id);return <li key={id}><span className="homepage-picker-number">{index+1}</span><div><strong>{c?.title||'Unavailable course'}</strong><small>{valid?c?.category:'Not visible — publish this course or remove it.'}</small></div><div className="homepage-picker-actions"><Button aria-label={`Move ${c?.title||'course'} up`} disabled={busy||index===0} onClick={()=>move(index,-1)}>↑</Button><Button aria-label={`Move ${c?.title||'course'} down`} disabled={busy||index===ids.length-1} onClick={()=>move(index,1)}>↓</Button><Button disabled={busy} onClick={()=>change(ids.filter(x=>x!==id))}>Remove</Button></div></li>})}</ol>
   {!ids.length&&<p>No courses selected. Save this to hide course cards on the homepage.</p>}
   <div className="homepage-picker-add"><label htmlFor="homepage-add">Add a course</label><select id="homepage-add" value="" disabled={busy||ids.length>=3||!available.length} onChange={e=>{if(e.target.value)change([...ids,e.target.value])}}><option value="">{ids.length>=3?'3 courses selected':available.length?'Choose a published course':'No other published courses'}</option>{available.map(c=><option key={c.id} value={c.id}>{c.title}</option>)}</select></div>
   <div className="homepage-picker-save"><Button variant="primary" disabled={busy||!dirty||ids.some(id=>!eligible.some(c=>c.id===id))} onClick={async()=>{setBusy(true);setError('');setMessage('');try{const r=await api.saveHomepageSelection(ids);setIds(r.courseIds);setSaved(r.courseIds);setMessage('Homepage courses saved.')}catch(e){setError(e instanceof Error?e.message:'Could not save. Try again.')}finally{setBusy(false)}}}>{busy?'Saving…':'Save homepage courses'}</Button>{dirty&&<span>Unsaved changes</span>}<a href="/" target="_blank" rel="noreferrer">Preview homepage ↗</a></div>
  </>}
  {error&&<p role="alert">{error} <Button disabled={busy} onClick={()=>setAttempt(n=>n+1)}>Reload selection</Button></p>}{message&&<p role="status">{message}</p>}
 </section>
}
