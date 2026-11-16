import { useEffect, useRef, useState } from 'react'

export type Filters = {level:string;price:string;duration:string;sort:string}
export const defaults:Filters={level:'',price:'',duration:'',sort:'popular'}

type Option={value:string;label:string}
export const FILTER_OPTIONS:Record<keyof Filters,{label:string;options:Option[]}>={
 level:{label:'Level',options:[{value:'',label:'All levels'},{value:'Beginner',label:'Beginner'},{value:'Intermediate',label:'Intermediate'},{value:'Advanced',label:'Advanced'}]},
 price:{label:'Price',options:[{value:'',label:'Any price'},{value:'free',label:'Free'},{value:'paid',label:'Paid'}]},
 duration:{label:'Duration',options:[{value:'',label:'Any duration'},{value:'short',label:'Under 2 hours'},{value:'long',label:'2 hours or more'}]},
 sort:{label:'Sort',options:[{value:'popular',label:'Popular'},{value:'newest',label:'Newest'},{value:'rating',label:'Highest rated'},{value:'shortest',label:'Shortest'}]},
}
export const FILTER_KEYS=Object.keys(FILTER_OPTIONS) as Array<keyof Filters>

/** Count of filters the visitor has actually set, so the mobile button can show it. */
export function activeCount(filters:Filters){return FILTER_KEYS.filter(k=>filters[k]&&filters[k]!==defaults[k]).length}

/** Native select, themed: one chevron is drawn here so every control in the toolbar matches. */
export function FilterSelect({name,value,onChange,visibleLabel=false}:{name:keyof Filters;value:string;onChange:(v:string)=>void;visibleLabel?:boolean}){
 const {label,options}=FILTER_OPTIONS[name]
 const select=<span className="courses-select">
  <select aria-label={visibleLabel?undefined:label} value={value} onChange={e=>onChange(e.target.value)}>
   {options.map(o=><option key={o.value} value={o.value}>{visibleLabel?o.label:value&&value!==defaults[name]?`${label}: ${o.label}`:o.label}</option>)}
  </select>
  <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m6 9 6 6 6-6"/></svg>
 </span>
 return visibleLabel?<label>{label}{select}</label>:select
}

export function FilterSelects({filters,change}:{filters:Filters;change:(key:keyof Filters,value:string)=>void}){
 return <div className="courses-controls">{FILTER_KEYS.map(k=><FilterSelect key={k} name={k} value={filters[k]} onChange={v=>change(k,v)}/>)}</div>
}

/** Bottom sheet for narrow screens. <dialog> gives the focus trap and Escape for free. */
export function FilterSheet({filters,apply,clear,close}:{filters:Filters;apply:(next:Filters)=>void;clear:()=>void;close:()=>void}){
 const ref=useRef<HTMLDialogElement>(null)
 const [draft,setDraft]=useState<Filters>(filters)
 useEffect(()=>{
  const dialog=ref.current!
  dialog.showModal()
  const overflow=document.body.style.overflow
  document.body.style.overflow='hidden'
  return()=>{dialog.close();document.body.style.overflow=overflow}
 },[])
 return <dialog ref={ref} className="courses-sheet" aria-labelledby="courses-sheet-title"
   onCancel={e=>{e.preventDefault();close()}}
   onClick={e=>{if(e.target===e.currentTarget)close()}}>
  <div className="courses-sheet-panel">
   <div className="courses-sheet-head">
    <h2 id="courses-sheet-title">Filters</h2>
    <button type="button" className="courses-sheet-close" aria-label="Close filters" onClick={close}>×</button>
   </div>
   <div className="courses-sheet-fields">
    {FILTER_KEYS.map(k=><FilterSelect key={k} name={k} value={draft[k]} visibleLabel onChange={v=>setDraft(d=>({...d,[k]:v}))}/>)}
   </div>
   <div className="courses-sheet-actions">
    <button type="button" className="courses-ghost" onClick={()=>{setDraft(defaults);clear();close()}}>Clear</button>
    <button type="button" className="courses-apply" onClick={()=>{apply(draft);close()}}>Apply</button>
   </div>
  </div>
 </dialog>
}
