import { useState } from 'react'
import { StudioDialog } from '../tutor/StudioDialog'
import { Dropdown } from './Dropdown'
export type Filters = {level:string;price:string;duration:string;sort:string}
export const defaults:Filters={level:'',price:'',duration:'',sort:'popular'}
export function FilterBar({filters,change,clear}:{filters:Filters;change:(key:keyof Filters,value:string)=>void;clear:()=>void}) {
 const [sheet,setSheet]=useState(false)
 const controls=<>
 <Dropdown label="Level" value={filters.level} options={['','Beginner','Intermediate','Advanced'].map(v=>({value:v,label:v||'All levels'}))} onChange={v=>change('level',v)}/>
 <Dropdown label="Price" value={filters.price} options={[{value:'',label:'Any price'},{value:'free',label:'Free'},{value:'paid',label:'Paid'}]} onChange={v=>change('price',v)}/>
 <Dropdown label="Duration" value={filters.duration} options={[{value:'',label:'Any duration'},{value:'short',label:'Under 2 hours'},{value:'long',label:'2 hours or more'}]} onChange={v=>change('duration',v)}/>
 <Dropdown label="Sort" value={filters.sort} options={[{value:'popular',label:'Popular'},{value:'newest',label:'Newest'},{value:'rating',label:'Highest rated'},{value:'shortest',label:'Shortest'}]} onChange={v=>change('sort',v)}/>
 </>
 return <><div className="catalogue-filter-row"><div className="catalogue-desktop-filters">{controls}</div><button className="studio-secondary catalogue-mobile-filter" onClick={()=>setSheet(true)}>Filters & sort</button><div className="catalogue-active-filters">{(['level','price','duration'] as const).filter(k=>filters[k]).map(k=><button key={k} className="catalogue-chip" aria-label={`Remove ${k} filter`} onClick={()=>change(k,'')}>{k}: {filters[k]} ×</button>)}{Object.entries(filters).some(([k,v])=>v&&v!==defaults[k as keyof Filters])&&<button className="catalogue-clear" onClick={clear}>Clear all</button>}</div></div>{sheet&&<StudioDialog title="Filters & sort" close={()=>setSheet(false)}><div className="catalogue-sheet-controls">{controls}</div><button className="studio-primary mt-6 w-full" onClick={()=>setSheet(false)}>Show courses</button></StudioDialog>}</>
}
