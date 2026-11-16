import { useEffect, useMemo, useRef, useState } from 'react'
import { useRouter } from 'next/router'
import Link from 'next/link'
import DocumentHead from '../../components/DocumentHead'
import { CourseCard } from '../../components/CourseCard'
import { CatalogueSkeletons } from '../../components/catalogue/CatalogueSkeletons'
import { CategoryTabs, categoryLabel } from '../../components/catalogue/CategoryTabs'
import { activeCount, defaults, FILTER_KEYS, FILTER_OPTIONS, FilterSelects, FilterSheet, Filters } from '../../components/catalogue/FilterBar'
import { api, Course, getStoredUser } from '../../lib/api'

type Result = Awaited<ReturnType<typeof api.catalogue>>
const PAGE_SIZE=9
const blank:Result={courses:[],total:0,totalCourses:0,categories:{},hasMore:false,suggested:[]}

/** Human label for one active filter, used on the removable chips. */
function filterLabel(key:keyof Filters,value:string){
 const found=FILTER_OPTIONS[key].options.find(o=>o.value===value)
 return `${FILTER_OPTIONS[key].label}: ${found?.label||value}`
}

export default function CoursesPage(){
 const router=useRouter()
 const [data,setData]=useState<Result>(blank),[loading,setLoading]=useState(true),[more,setMore]=useState(false),[error,setError]=useState(''),[attempt,setAttempt]=useState(0)
 const [q,setQ]=useState(''),[enrolled,setEnrolled]=useState<Course[]>([]),[sheet,setSheet]=useState(false)
 const input=useRef<HTMLInputElement>(null), sequence=useRef(0)
 const str=(key:string)=>typeof router.query[key]==='string'?router.query[key] as string:''
 const category=str('category'), query=str('q')
 const filters:Filters={level:str('level'),price:str('price'),duration:str('duration'),sort:str('sort')||'popular'}
 const filterKey=JSON.stringify({q:query,category,...filters})
 // Chips and selects push, so Back undoes one choice; typing replaces, so Back is not a per-keystroke trap.
 function change(values:Record<string,string>,history:'push'|'replace'='push'){const next={...router.query,...values};Object.keys(next).forEach(k=>{if(!next[k]||next[k]==='popular')delete next[k]});void router[history]({pathname:'/courses',query:next},undefined,{shallow:true,scroll:false})}
 function clear(){setQ('');void router.push('/courses',undefined,{shallow:true,scroll:false})}
 useEffect(()=>{setQ(query)},[query])
 useEffect(()=>{if(!router.isReady||q===query)return;const timer=setTimeout(()=>change({q:q.trim()},'replace'),200);return()=>clearTimeout(timer)},[q,query,router.isReady,category,filters.level,filters.price,filters.duration,filters.sort])
 useEffect(()=>{if(!router.isReady)return;const id=++sequence.current;setLoading(true);setError('');setMore(false);setData(old=>({...old,courses:[],total:0,hasMore:false}));api.catalogue({q:query,category,...filters,limit:String(PAGE_SIZE)}).then(result=>{if(sequence.current===id)setData(result)}).catch(e=>{if(sequence.current===id)setError(e.message)}).finally(()=>{if(sequence.current===id)setLoading(false)});return()=>{sequence.current++}},[router.isReady,filterKey,attempt])
 useEffect(()=>{if(getStoredUser())api.myCourses().then(c=>setEnrolled(c.filter(c=>(c.progress?.percent||0)<100).slice(0,3))).catch(()=>{});function key(e:KeyboardEvent){if(e.key==='/'&&!e.metaKey&&!e.ctrlKey&&!(e.target as HTMLElement).closest('input,textarea,select,[contenteditable=true]')){e.preventDefault();input.current?.focus()}}document.addEventListener('keydown',key);return()=>document.removeEventListener('keydown',key)},[])
 async function loadMore(){const id=sequence.current;setMore(true);setError('');try{const result=await api.catalogue({q:query,category,...filters,limit:String(PAGE_SIZE),offset:String(data.courses.length)});if(id===sequence.current)setData(old=>({...result,courses:[...old.courses,...result.courses]}))}catch(e){if(id===sequence.current)setError(e instanceof Error?e.message:'Could not load more courses')}finally{if(id===sequence.current)setMore(false)}}
 function help(){window.dispatchEvent(new CustomEvent('ef:ask-tutor',{detail:{q:'Where should I start?'}}))}

 // The tutor only earns a line on the card when the catalogue actually has several.
 const showTutor=useMemo(()=>new Set(data.courses.map(c=>c.tutor?.name||c.instructor?.name).filter(Boolean)).size>1,[data.courses])
 const set=activeCount(filters)+(category?1:0)+(query?1:0)
 const empty=!loading&&!error&&data.courses.length===0

 return <><DocumentHead title="Courses — EchoFreelance Tech School"/><main className="courses-page">
  <header className="courses-hero">
   <p className="courses-hero-eyebrow">02 / The course index</p>
   <h1>Find your next piece of work.</h1>
   <p className="courses-hero-sub">Cybersecurity, software and cloud. Learn the ideas, then put them to work.</p>
   <span className="courses-hero-count">{loading?'Loading…':`${data.totalCourses} course${data.totalCourses===1?'':'s'}`}</span>
  </header>

  <div className="courses-toolbar">
   <label className="courses-search">
    <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="10" cy="10" r="6"/><path d="m15 15 5 5"/></svg>
    <span className="sr-only">Search courses</span>
    <input ref={input} type="search" value={q} onChange={e=>setQ(e.target.value)} placeholder="Search courses"/>
    <kbd aria-hidden="true">/</kbd>
   </label>
   <FilterSelects filters={filters} change={(key,value)=>change({[key]:value})}/>
   <button type="button" className="courses-filter-button" aria-haspopup="dialog" onClick={()=>setSheet(true)}>
    Filters{set>0&&<span className="courses-filter-count">{set}</span>}
   </button>
   <button type="button" className="courses-assistant" onClick={help}>
    <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3v4M12 17v4M3 12h4M17 12h4M6 6l2.5 2.5M15.5 15.5 18 18M18 6l-2.5 2.5M8.5 15.5 6 18"/></svg>
    <span className="courses-assistant-long">Not sure where to start? </span>Ask the assistant
   </button>
  </div>

  <CategoryTabs categories={data.categories} total={data.totalCourses} value={category} onChange={v=>change({category:v})}/>

  <div className="courses-results">
   <p className="courses-count" role="status" aria-live="polite">{loading?'Loading courses…':`Showing ${data.courses.length} of ${data.total} course${data.total===1?'':'s'}`}</p>
   {set>0&&<div className="courses-active">
    {category&&<button type="button" className="courses-active-chip" onClick={()=>change({category:''})}>{categoryLabel(category)}<span aria-hidden="true">×</span><span className="sr-only">Remove category filter</span></button>}
    {query&&<button type="button" className="courses-active-chip" onClick={()=>{setQ('');change({q:''})}}>“{query}”<span aria-hidden="true">×</span><span className="sr-only">Clear search</span></button>}
    {FILTER_KEYS.filter(k=>filters[k]&&filters[k]!==defaults[k]).map(k=><button key={k} type="button" className="courses-active-chip" onClick={()=>change({[k]:''})}>{filterLabel(k,filters[k])}<span aria-hidden="true">×</span><span className="sr-only">Remove {FILTER_OPTIONS[k].label} filter</span></button>)}
    <button type="button" className="courses-clear" onClick={clear}>Clear all</button>
   </div>}
  </div>

  {enrolled.length>0&&<section className="courses-continue" aria-labelledby="continue-title">
   <h2 id="continue-title">Continue learning</h2>
   <ul>{enrolled.map(c=><li key={c.id}>
    <Link href={`/courses/${c.id}`}>{c.title}</Link>
    <progress value={c.progress?.percent||0} max={100} aria-label={`${c.title} progress`}/>
    <span>{c.progress?.percent||0}% complete</span>
   </li>)}</ul>
  </section>}

  {error&&<div className="courses-error" role="alert">
   <h2>Could not load courses.</h2>
   <p>{error}</p>
   <div className="courses-empty-actions"><button type="button" className="courses-ghost" onClick={()=>setAttempt(a=>a+1)}>Retry</button></div>
  </div>}

  {loading&&<CatalogueSkeletons count={PAGE_SIZE}/>}

  {!loading&&!error&&data.courses.length>0&&<ul className="courses-grid">
   {data.courses.map(c=><li key={c.id}><CourseCard course={c} showTutor={showTutor}/></li>)}
  </ul>}

  {empty&&<>
   <div className="courses-empty">
    <h2>{data.totalCourses?'No courses match.':'The next courses are being prepared.'}</h2>
    <p>{data.totalCourses?'Try another category, or clear the filters to see everything.':'Tutors are preparing the lessons. Check the live schedule while you wait.'}</p>
    <div className="courses-empty-actions">
     {data.totalCourses?<button type="button" className="courses-ghost" onClick={clear}>Clear filters</button>:null}
     <Link className="courses-ghost" href="/classes">Browse live classes</Link>
    </div>
   </div>
   {data.suggested.length>0&&<section className="courses-suggested">
    <h2>Popular courses</h2>
    <ul className="courses-grid">{data.suggested.map(c=><li key={c.id}><CourseCard course={c} showTutor={showTutor}/></li>)}</ul>
   </section>}
  </>}

  {!loading&&data.courses.length>0&&<div className="courses-pagination">
   <p>Showing 1–{data.courses.length} of {data.total}</p>
   {data.hasMore
    ?<button type="button" className="courses-ghost" onClick={loadMore} disabled={more}>{more?'Loading…':`Load ${Math.min(PAGE_SIZE,data.total-data.courses.length)} more`}</button>
    :<p>You’re up to date.</p>}
  </div>}

  {sheet&&<FilterSheet filters={filters} close={()=>setSheet(false)}
    apply={next=>change({level:next.level,price:next.price,duration:next.duration,sort:next.sort})}
    clear={clear}/>}
 </main></>
}
