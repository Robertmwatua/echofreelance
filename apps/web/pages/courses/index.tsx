import Image from 'next/image'
import {Button,NavigationLink} from '../../components/Button'
import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/router'
import Link from 'next/link'
import DocumentHead from '../../components/DocumentHead'
import { CourseCard } from '../../components/CourseCard'
import { CatalogueSkeletons } from '../../components/catalogue/CatalogueSkeletons'
import { CategoryTabs } from '../../components/catalogue/CategoryTabs'
import { defaults, FilterBar, Filters } from '../../components/catalogue/FilterBar'
import { api, Course, getStoredUser } from '../../lib/api'

type Result = Awaited<ReturnType<typeof api.catalogue>>
const PAGE_SIZE=6
const blank:Result={courses:[],total:0,totalCourses:0,categories:{},hasMore:false,suggested:[]}
export default function CoursesPage(){
 const router=useRouter()
 const [data,setData]=useState<Result>(blank),[loading,setLoading]=useState(true),[more,setMore]=useState(false),[error,setError]=useState(''),[attempt,setAttempt]=useState(0)
 const [q,setQ]=useState(''),[enrolled,setEnrolled]=useState<Course[]>([])
 const input=useRef<HTMLInputElement>(null), sequence=useRef(0)
 const str=(key:string)=>typeof router.query[key]==='string'?router.query[key] as string:''
 const category=str('category'), query=str('q')
 const filters:Filters={level:str('level'),price:str('price'),duration:str('duration'),sort:str('sort')||'popular'}
 const filterKey=JSON.stringify({q:query,category,...filters})
 function change(values:Record<string,string>){const next={...router.query,...values};Object.keys(next).forEach(k=>{if(!next[k]||next[k]==='popular')delete next[k]});void router.replace({pathname:'/courses',query:next},undefined,{shallow:true,scroll:false})}
 function clear(){setQ('');void router.replace('/courses',undefined,{shallow:true,scroll:false})}
 useEffect(()=>{setQ(query)},[query])
 useEffect(()=>{if(!router.isReady||q===query)return;const timer=setTimeout(()=>change({q:q.trim()}),250);return()=>clearTimeout(timer)},[q,query,router.isReady,category,filters.level,filters.price,filters.duration,filters.sort])
 useEffect(()=>{if(!router.isReady)return;const id=++sequence.current;setLoading(true);setError('');setMore(false);setData(old=>({...old,courses:[],total:0,hasMore:false}));api.catalogue({q:query,category,...filters,limit:String(PAGE_SIZE)}).then(result=>{if(sequence.current===id)setData(result)}).catch(e=>{if(sequence.current===id)setError(e.message)}).finally(()=>{if(sequence.current===id)setLoading(false)});return()=>{sequence.current++}},[router.isReady,filterKey,attempt])
 useEffect(()=>{if(getStoredUser())api.myCourses().then(c=>setEnrolled(c.filter(c=>(c.progress?.percent||0)<100).slice(0,3))).catch(()=>{});function key(e:KeyboardEvent){if(e.key==='/'&&!e.metaKey&&!e.ctrlKey&&!(e.target as HTMLElement).closest('input,textarea,select,[contenteditable=true]')){e.preventDefault();input.current?.focus()}}document.addEventListener('keydown',key);return()=>document.removeEventListener('keydown',key)},[])
 async function loadMore(){const id=sequence.current;setMore(true);setError('');try{const result=await api.catalogue({q:query,category,...filters,limit:String(PAGE_SIZE),offset:String(data.courses.length)});if(id===sequence.current)setData(old=>({...result,courses:[...old.courses,...result.courses]}))}catch(e){if(id===sequence.current)setError(e instanceof Error?e.message:'Could not load more courses')}finally{if(id===sequence.current)setMore(false)}}
 function help(){window.dispatchEvent(new CustomEvent('ef:ask-tutor',{detail:{q:'Where should I start?'}}))}
 return <><DocumentHead title="Courses — EchoFreelance Tech School"/><main className="ef-workspace catalogue mx-auto max-w-[1248px] px-5 pb-16 pt-6 sm:px-6">
 <header className="catalogue-heading"><div><p className="ef-page-label">02 / The course index</p><h1 className="ef-title">Find your next<br/>piece of work.</h1><p className="ef-muted mt-5 max-w-xl">Cybersecurity, software and cloud. Learn the ideas, then put them to work.</p><span className="ef-meta mt-5 block" aria-live="polite">{loading?'Loading…':`${data.total} course${data.total===1?'':'s'}`}</span></div><div className="catalogue-search-block"><label className="studio-search"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden><circle cx="10" cy="10" r="6"/><path d="m15 15 5 5"/></svg><span className="sr-only">Search courses</span><input ref={input} value={q} onChange={e=>setQ(e.target.value)} placeholder="Search courses"/><kbd>/</kbd></label><Button className="catalogue-help" onClick={help}>Not sure where to start? Ask the assistant</Button><figure className="catalogue-intro-photo"><Image loading="lazy" sizes="(max-width: 767px) 90vw, 360px" decoding="async" src="/wallpapers/security-lab.webp" width="1536" height="1024" alt="Illustrative technical workspace with a laptop and network equipment"/><figcaption>Choose a route. Make something work.</figcaption></figure></div></header>
 {enrolled.length>0&&<section className="catalogue-continue" aria-labelledby="continue-title"><h2 id="continue-title">Continue learning</h2><div>{enrolled.map(c=><article key={c.id}><Link href={`/courses/${c.id}`}>{c.title}</Link><progress value={c.progress?.percent||0} max={100} aria-label={`${c.title} progress`}/><span className="ef-muted">{c.progress?.percent||0}% complete</span><Link className="studio-ghost" href={`/courses/${c.id}`}>Resume →</Link></article>)}</div></section>}
 <CategoryTabs categories={data.categories} total={data.totalCourses} value={category} onChange={v=>change({category:v})}/>
 <FilterBar filters={filters} change={(key,value)=>change({[key]:value})} clear={clear}/>
 {error&&<p className="studio-error mb-5" role="alert">Could not load courses. {error} <Button className="studio-ghost" onClick={()=>setAttempt(a=>a+1)}>Retry</Button></p>}
 {loading?<CatalogueSkeletons/>:!error||data.courses.length?<>{data.courses.length?<ul className="catalogue-grid">{data.courses.map(c=><li key={c.id}><CourseCard course={c}/></li>)}</ul>:<><div className="catalogue-empty"><p className="ef-section-label">Index / next step</p><h2 className="mt-3">{data.totalCourses ? 'No courses match your filters.' : 'The next courses are being prepared.'}</h2><p className="ef-muted mt-3">{data.totalCourses ? 'Try another topic or clear your filters.' : 'Tutors are preparing the lessons. Check the live schedule while you wait.'}</p><NavigationLink href="/classes" className="ef-btn-ghost mt-3">Browse live classes →</NavigationLink><Button className="studio-primary mt-4" onClick={clear}>Clear filters</Button></div>{data.suggested.length>0&&<section className="mt-8"><h2 className="mb-4 text-lg font-semibold">Popular courses</h2><ul className="catalogue-grid">{data.suggested.map(c=><li key={c.id}><CourseCard course={c}/></li>)}</ul></section>}</>}{data.courses.length>0&&<div className="catalogue-pagination"><p className="ef-meta" role="status">Showing {data.courses.length} of {data.total} courses</p>{data.hasMore?<Button variant="primary" loading={more} loadingLabel="Loading courses…" onClick={loadMore}>Load {Math.min(PAGE_SIZE,data.total-data.courses.length)} more courses <span aria-hidden>↓</span></Button>:<p className="ef-muted">You’re up to date. Pick a course and explore its roadmap.</p>}</div>}</>:null}
 </main></>
}
