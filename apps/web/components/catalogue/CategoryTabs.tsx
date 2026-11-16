import { useEffect, useRef, useState } from 'react'

export function normalizeCategory(value: string) { return value.trim().replace(/animaion/ig,'animation').replace(/\s+/g,' ').toLowerCase() }
export function categoryLabel(value: string) { return normalizeCategory(value).replace(/\b\w/g,c=>c.toUpperCase()).replace(/\bAi\b/g,'AI').replace(/\bIt\b/g,'IT').replace(/Web3/g,'Web3') }

/** One scrolling line of chips: a wrapped second row read as a layout bug.
    The fade is only drawn when the row really does overflow. */
export function CategoryTabs({categories,value,total,onChange}:{categories:Record<string,number>;value:string;total:number;onChange:(v:string)=>void}) {
  const current=normalizeCategory(value)
  const row=useRef<HTMLDivElement>(null)
  const [overflow,setOverflow]=useState(false)
  const chips:Array<[string,string,number]>=[['','All courses',total],...Object.entries(categories).sort(([a],[b])=>a.localeCompare(b)).map(([c,n])=>[c,categoryLabel(c),n] as [string,string,number])]
  useEffect(()=>{
    const element=row.current
    if(!element||typeof ResizeObserver==='undefined')return
    const check=()=>setOverflow(element.scrollWidth>element.clientWidth+1)
    check()
    const observer=new ResizeObserver(check)
    observer.observe(element)
    return()=>observer.disconnect()
  },[chips.length])
  return <div ref={row} className="courses-chips" data-overflow={overflow||undefined} role="group" aria-label="Course categories">
    {chips.map(([slug,label,count])=><button key={slug||'all'} type="button" className="courses-chip" aria-pressed={current===slug} onClick={()=>onChange(slug)}>
      {label} <span>{count}</span>
    </button>)}
  </div>
}
