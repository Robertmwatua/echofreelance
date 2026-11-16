import {ReactNode,useEffect,useMemo,useState} from 'react'
import {useSavedChoice} from './Workspace'
import {EmptyState,SegmentedFilter} from './ui'

const Chevron=()=><svg viewBox="0 0 24 24" aria-hidden="true"><path d="m6 9 6 6 6-6"/></svg>
export type Column<T>={key:string;title:string;value:(row:T)=>string|number;render?:(row:T)=>ReactNode;numeric?:boolean}
export function DataTable<T extends {id:string}>({name,rows,columns,status,date,course,bulkActions,empty='No matching records. Clear your filters to see more.',initialStatus='All',rowId,onRowOpen,loading=false}:{name:string;rows:T[];columns:Column<T>[];status?:(r:T)=>string;date?:(r:T)=>string;course?:(r:T)=>string;bulkActions?:(rows:T[],clear:()=>void)=>ReactNode;empty?:string;initialStatus?:string;rowId?:string;onRowOpen?:(row:T)=>void;loading?:boolean}){
 const [filters,setFilters]=useSavedChoice(name==='people'?'people-v2':name,{q:'',status:initialStatus,course:'All',from:'',to:'',sort:name==='people'?'joined':columns[0].key,desc:name==='people'})
 const [page,setPage]=useState(0),[selected,setSelected]=useState<string[]>([])
 useEffect(()=>{if(initialStatus!=='All')setFilters(f=>({...f,status:initialStatus}))},[initialStatus])
 const statuses=['All',...Array.from(new Set(rows.map(r=>status?.(r)||'').filter(Boolean)))],courses=['All',...Array.from(new Set(rows.map(r=>course?.(r)||'').filter(Boolean)))]
 const filtered=useMemo(()=>{const col=columns.find(c=>c.key===filters.sort)||columns[0];return rows.filter(r=>(!rowId||r.id===rowId)&&columns.some(c=>String(c.value(r)).toLowerCase().includes(filters.q.toLowerCase()))&&(!status||filters.status==='All'||status(r)===filters.status)&&(!course||filters.course==='All'||course(r)===filters.course)&&(!date||(!filters.from||date(r).slice(0,10)>=filters.from)&&(!filters.to||date(r).slice(0,10)<=filters.to))).sort((a,b)=>{const x=col.value(a),y=col.value(b);const n=typeof x==='number'&&typeof y==='number'?x-y:String(x).localeCompare(String(y));return filters.desc?-n:n})},[rows,filters,rowId])
 useEffect(()=>{setPage(0);setSelected([])},[filters.q,filters.status,filters.course,filters.from,filters.to,rowId]);const visible=filtered.slice(page*20,page*20+20)
 useEffect(()=>{if(page>0&&!visible.length)setPage(0)},[filtered.length,page])
 function exportCsv(){const escape=(s:string|number)=>{let v=String(s);if(/^[\s]*[=+\-@]/.test(v))v="'"+v;return '"'+v.replace(/"/g,'""')+'"'};const data=[columns.map(c=>escape(c.title)).join(','),...filtered.map(r=>columns.map(c=>escape(c.value(r))).join(','))].join('\r\n');const url=URL.createObjectURL(new Blob(['\uFEFF'+data],{type:'text/csv;charset=utf-8;'}));const a=document.createElement('a');a.href=url;a.download=`${name}.csv`;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000)}
 return <section className="admin-table-space" aria-busy={loading}>
 <div className="adm-toolbar">
  <label className="adm-search">
   <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="10" cy="10" r="6"/><path d="m15 15 5 5"/></svg>
   <span className="sr-only">Search</span>
   <input type="search" value={filters.q} onChange={e=>setFilters({...filters,q:e.target.value})} placeholder={name==='people'?'Name or email…':'Search records…'}/>
  </label>
  {status&&<SegmentedFilter label="Filter by status" value={filters.status} onChange={v=>setFilters({...filters,status:v})}
    options={statuses.map(v=>({value:v,label:v,count:v==='All'?rows.length:rows.filter(r=>status(r)===v).length}))}/>}
  <div className="adm-toolbar-end">
   {course&&<span className="adm-select"><select aria-label="Course" value={filters.course} onChange={e=>setFilters({...filters,course:e.target.value})}>{courses.map(c=><option key={c}>{c}</option>)}</select><Chevron/></span>}
   {date&&<span className="adm-select"><select aria-label="Date range" value={!filters.from?'all':filters.to?'custom':'recent'} onChange={e=>{const days=Number(e.target.value);const from=days?new Date(Date.now()-days*86400000).toISOString().slice(0,10):'';setFilters({...filters,from,to:''})}}><option value="all">All dates</option><option value="7">Last 7 days</option><option value="30">Last 30 days</option><option value="90">Last 90 days</option>{filters.from&&<option value={filters.to?'custom':'recent'}>Since {new Date(filters.from+'T00:00:00').toLocaleDateString('en-GB')}</option>}</select><Chevron/></span>}
   <button type="button" className="adm-button-secondary" onClick={exportCsv} disabled={loading||!filtered.length}>Export CSV ({filtered.length})</button>
  </div>
 </div>
 <div className="admin-result-row"><span role="status">{loading?'Loading…':name==='people'?filtered.length+(filtered.length===1?' person':' people'):filtered.length+' records'}</span>{(filters.q||filters.status!=='All'||filters.course!=='All'||filters.from||filters.to)&&<button type="button" className="adm-button-ghost" onClick={()=>setFilters({q:'',status:'All',course:'All',from:'',to:'',sort:name==='people'?'joined':columns[0].key,desc:name==='people'})}>Clear filters</button>}<label className="admin-mobile-sort">Sort<select className="ef-input" value={filters.sort} onChange={e=>setFilters({...filters,sort:e.target.value})}>{columns.map(c=><option value={c.key} key={c.key}>{c.title}</option>)}</select><button type="button" className="admin-sort-direction" onClick={()=>setFilters({...filters,desc:!filters.desc})}>{filters.desc?'Descending ↓':'Ascending ↑'}</button></label></div>
 {selected.length>0&&bulkActions&&<div className="admin-bulk" role="region" aria-label="Bulk actions"><strong>{selected.length} selected</strong>{bulkActions(rows.filter(r=>selected.includes(r.id)),()=>setSelected([]))}<button type="button" className="adm-button-ghost" onClick={()=>setSelected([])}>Clear selection</button></div>}
 <div className="admin-data-scroll"><table className="ef-data-table admin-data-table"><thead><tr>{bulkActions&&<th><input type="checkbox" aria-label="Select visible rows" checked={visible.length>0&&visible.every(r=>selected.includes(r.id))} onChange={e=>setSelected(e.target.checked?Array.from(new Set([...selected,...visible.map(r=>r.id)])):selected.filter(id=>!visible.some(r=>r.id===id)))}/></th>}{columns.map(c=><th key={c.key} aria-sort={filters.sort===c.key?(filters.desc?'descending':'ascending'):'none'} className={c.numeric?'admin-number':''}><button type="button" className="admin-sort-button" onClick={()=>setFilters({...filters,sort:c.key,desc:filters.sort===c.key?!filters.desc:false})}>{c.title}{filters.sort===c.key&&<span className="admin-sort-arrow" aria-hidden="true">{filters.desc?'↓':'↑'}</span>}</button></th>)}</tr></thead><tbody>{!loading&&visible.map(r=><tr key={r.id} className={onRowOpen?'admin-openable-row':undefined} onClick={onRowOpen?e=>{if(!(e.target as HTMLElement).closest('button,a,input,select,textarea,label')&&!window.getSelection()?.toString())onRowOpen(r)}:undefined}>{bulkActions&&<td data-label="Select"><input type="checkbox" aria-label={`Select ${columns[0].value(r)}`} checked={selected.includes(r.id)} onChange={e=>setSelected(e.target.checked?[...selected,r.id]:selected.filter(id=>id!==r.id))}/></td>}{columns.map(c=><td key={c.key} data-label={c.title} className={c.numeric?'admin-number':''}>{c.render?c.render(r):c.value(r)}</td>)}</tr>)}{loading&&Array.from({length:5},(_,i)=><tr key={i} aria-hidden="true">{bulkActions&&<td/>}{columns.map(c=><td key={c.key}><span className="admin-cell-skeleton"/></td>)}</tr>)}</tbody></table></div>{!loading&&!filtered.length&&<EmptyState title={empty}/>}
 <div className="admin-table-footer">
  <span>{filtered.length?`Showing ${page*20+1}–${Math.min(page*20+20,filtered.length)} of ${filtered.length}`:'0 records'}</span>
  <span className="flex gap-3">
   <button type="button" className="adm-button-secondary" disabled={page===0} onClick={()=>setPage(n=>n-1)}>Previous</button>
   <button type="button" className="adm-button-secondary" disabled={(page+1)*20>=filtered.length} onClick={()=>setPage(n=>n+1)}>Next</button>
  </span>
 </div></section>
}
