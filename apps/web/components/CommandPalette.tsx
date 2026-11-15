import Link from 'next/link'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import { StudioDialog } from './tutor/StudioDialog'
export function CommandPalette(){
 const [open,setOpen]=useState(false),[q,setQ]=useState('')
 const router=useRouter()
 useEffect(()=>{function key(e:KeyboardEvent){if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==='k'){e.preventDefault();setOpen(p=>!p)}}document.addEventListener('keydown',key);return()=>document.removeEventListener('keydown',key)},[])
 return open?<StudioDialog title="Search & navigate" close={()=>setOpen(false)}><form className="mt-5" onSubmit={e=>{e.preventDefault();setOpen(false);void router.push(`/courses?q=${encodeURIComponent(q)}`)}}><label className="sr-only" htmlFor="command-search">Search courses</label><input id="command-search" autoFocus className="ef-input" placeholder="Search courses…" value={q} onChange={e=>setQ(e.target.value)}/><button className="studio-primary mt-3">Search courses</button></form><nav className="studio-action-list" aria-label="Quick navigation">{[['Courses','/courses'],['Live classes','/classes'],['My learning','/student'],['Tutor studio','/tutor'],['Settings','/settings']].filter(([label])=>!q||label.toLowerCase().includes(q.toLowerCase())).map(([label,path])=><Link key={path} href={path} onClick={()=>setOpen(false)}>{label}</Link>)}</nav></StudioDialog>:null
}
