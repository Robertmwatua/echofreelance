import {Button} from '../Button'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { useEffect, useMemo, useRef, useState } from 'react'
import { api, Course, formatPrice } from '../../lib/api'
import { StudioDialog } from './StudioDialog'
import { QuickCreate } from './QuickCreate'

const status = (c: Course) => c.archived ? 'Archived' : c.published ? 'Published' : 'Draft'
function missing(c: Course) {
  return [!c.title.trim() || c.description.trim().length < 10 ? 'Course details' : '', !c.lessonCount ? 'At least one lesson' : '', c.description.includes('Fees, duration, intake dates and lesson content are awaiting confirmation.') ? 'Confirm pricing and review course details' : '', !c.published ? 'Publish' : ''].filter(Boolean)
}
function relative(date?: string) {
  if (!date) return '—'
  return new Date(date).toLocaleDateString('en-GB',{day:'2-digit',month:'short',year:'numeric'})
}
export function CourseStudio({ courses, loading, error, reload, setCourses }: { courses: Course[]; loading: boolean; error: string; reload: () => Promise<void>; setCourses: React.Dispatch<React.SetStateAction<Course[]>> }) {
  const router = useRouter()
  const [q, setQ] = useState(''), [tab, setTab] = useState('All'), [category, setCategory] = useState(''), [sort, setSort] = useState('updated'), [grid, setGrid] = useState(false)
  const [selected, setSelected] = useState<string[]>([]), [page, setPage] = useState(1), [size, setSize] = useState(10)
  const [create, setCreate] = useState(false), [shortcuts, setShortcuts] = useState(false), [actions, setActions] = useState<Course | null>(null)
  const [deleting, setDeleting] = useState<Course[]>([]), [confirmNames, setConfirmNames] = useState<Record<string, string>>({}), [categoryDialog, setCategoryDialog] = useState(false)
  const [busy, setBusy] = useState(false), [notice, setNotice] = useState(''), [failure, setFailure] = useState('')
  const [undo, setUndo] = useState<Course[]>([]), [rename, setRename] = useState(''), [renameValue, setRenameValue] = useState('')
  const navigationTimer = useRef<ReturnType<typeof setTimeout>>()
  useEffect(() => () => { clearTimeout(navigationTimer.current) }, [])
  const searchRef = useRef<HTMLInputElement>(null), rowsRef = useRef<HTMLTableSectionElement>(null)
  const categories = useMemo(() => Array.from(new Set(courses.map(c => c.category))).sort(), [courses])
  const filtered = useMemo(() => courses.filter(c => (tab === 'All' || status(c) === tab) && (!category || c.category === category) && `${c.title} ${c.category}`.toLowerCase().includes(q.toLowerCase())).sort((a,b) => sort === 'name' ? a.title.localeCompare(b.title) : sort === 'students' ? (b.enrollmentCount || 0) - (a.enrollmentCount || 0) : sort === 'rating' ? (b.avgRating || 0) - (a.avgRating || 0) : (b.updatedAt || '').localeCompare(a.updatedAt || '')), [courses, tab, category, q, sort])
  const pages = Math.max(1, Math.ceil(filtered.length / size)), current = Math.min(page, pages), visible = filtered.slice((current - 1) * size, current * size)
  const picked = courses.filter(c => selected.includes(c.id))
  const reviewCount = courses.reduce((n,c) => n + (c.reviewCount || 0),0)
  const average = reviewCount ? (courses.reduce((n,c) => n + (c.avgRating || 0) * (c.reviewCount || 0),0) / reviewCount).toFixed(1) : '—'
  useEffect(() => { setPage(1) }, [q,tab,category,sort,size])
  useEffect(() => { setSelected(ids => ids.filter(id => courses.some(c => c.id === id))) }, [courses])
  useEffect(() => {
    function key(e: KeyboardEvent) {
      if (create || shortcuts || actions || deleting.length || categoryDialog || busy || e.ctrlKey || e.metaKey || e.altKey) return
      if ((e.target as HTMLElement).closest('input,textarea,select,[contenteditable=true]')) return
      if (e.key === '/') { e.preventDefault(); searchRef.current?.focus() }
      if (e.key === 'n') { e.preventDefault(); setCreate(true) }
      if (e.key === '?') { e.preventDefault(); setShortcuts(true) }
      if (e.key === 'Escape') setSelected([])
      if (e.key === 'j' || e.key === 'k') {
        e.preventDefault()
        const rows = Array.from(rowsRef.current?.querySelectorAll<HTMLElement>('tr[data-course]') || [])
        const index = rows.indexOf(document.activeElement as HTMLElement)
        rows[Math.max(0, Math.min(rows.length-1, index + (e.key === 'j' ? 1 : -1)))]?.focus()
      }
    }
    document.addEventListener('keydown',key); return () => document.removeEventListener('keydown',key)
  }, [create,shortcuts,actions,deleting,categoryDialog,busy])
  const select = (id: string) => setSelected(ids => ids.includes(id) ? ids.filter(x => x !== id) : [...ids,id])
  async function update(items: Course[], changes: Partial<Course>, archiveUndo = false) {
    if (busy) return
    setBusy(true); setFailure(''); setNotice('')
    const snapshots = items.map(c => ({...c}))
    if (changes.published) {
      const invalid = items.find(c => c.archived || missing(c).some(m => m !== 'Publish'))
      if (invalid) { setFailure(`“${invalid.title}”: ${invalid.archived ? 'restore before publishing' : missing(invalid).filter(m => m !== 'Publish').join(', ')}.`); setBusy(false); return }
    }
    setCourses(all => all.map(c => items.some(i => i.id === c.id) ? {...c,...changes, ...(changes.archived ? {published:false} : {})} : c))
    try {
      for (const item of items) await api.updateCourse(item.id, changes)
      if (archiveUndo) setUndo(snapshots)
      setSelected([]); setNotice(`${items.length} course${items.length === 1 ? '' : 's'} updated.`)
    } catch(e) { setFailure(e instanceof Error ? e.message : 'Update failed.'); }
    finally { try { await reload() } catch { setFailure('Could not refresh courses. Retry to confirm the current state.') }; setBusy(false) }
  }
  async function restore() {
    setBusy(true); setFailure('')
    try { for (const c of undo) await api.updateCourse(c.id,{archived:c.archived || false,published:c.published}); setUndo([]); await reload(); setNotice('Archive undone.') }
    catch(e) { setFailure(e instanceof Error ? e.message : 'Could not undo archive.') } finally { setBusy(false) }
  }
  async function duplicate(c: Course) {
    setActions(null); setBusy(true); setFailure('')
    try { const copy = await api.duplicateCourse(c.id); await reload(); setNotice(`Created “${copy.title}” as a draft.`) }
    catch(e) { setFailure(e instanceof Error ? e.message : 'Could not duplicate course.') } finally { setBusy(false) }
  }
  async function remove() {
    setBusy(true); setFailure('')
    const ids = deleting.map(c => c.id)
    setCourses(all => all.filter(c => !ids.includes(c.id)))
    try { for (const c of deleting) await api.deleteCourse(c.id); setDeleting([]); setSelected([]); setNotice('Courses deleted permanently.') }
    catch(e) { setDeleting([]); setFailure(e instanceof Error ? e.message : 'Deletion failed.') }
    finally { try { await reload() } catch { setFailure('Could not refresh courses. Retry before making another change.') }; setBusy(false) }
  }
  function askDelete(items: Course[]) { setActions(null); setConfirmNames({}); setDeleting(items) }
  const contextual = (c: Course) => c.archived ? <Button className="studio-ghost" disabled={busy} onClick={() => update([c],{archived:false})}>Restore</Button> : !c.lessonCount ? <Link className="studio-ghost" href={`/tutor/courses/${c.id}#lessons`}>Add lessons</Link> : !c.published ? <Button className="studio-ghost" disabled={busy} onClick={() => update([c],{published:true})}>Publish</Button> : <Link className="studio-ghost" href={`/tutor/courses/${c.id}`}>Manage</Link>
  function courseTitle(c: Course) { return rename === c.id ? <form onSubmit={e => {e.preventDefault(); if(renameValue.trim().length >= 3) { setRename(''); void update([c],{title:renameValue.trim()}) }}}><input autoFocus required minLength={3} aria-label="Rename course" className="ef-input" value={renameValue} onChange={e => setRenameValue(e.target.value)} onKeyDown={e => {if(e.key === 'Escape') setRename('')}} /><Button className="studio-ghost" disabled={busy}>Save</Button><Button type="button" className="studio-ghost" onClick={() => setRename('')}>Cancel</Button></form> : <><Link className="studio-course-title" href={`/tutor/courses/${c.id}`} onClick={e => {if(e.metaKey||e.ctrlKey||e.shiftKey||e.altKey||e.detail===0)return;e.preventDefault();clearTimeout(navigationTimer.current);navigationTimer.current=setTimeout(()=>void router.push(`/tutor/courses/${c.id}`),250)}} onDoubleClick={e => {e.preventDefault();clearTimeout(navigationTimer.current);setRename(c.id);setRenameValue(c.title)}}>{c.title}</Link><p className="ef-muted mt-1 text-xs">{c.category}</p><div className="studio-completeness" data-complete={missing(c).length===0} title={`Missing: ${missing(c).join(', ') || 'Nothing — ready'}`}><span style={{width:`${(4 - Math.min(4,missing(c).length)) / 4 *100}%`}} /></div><span className="ef-muted text-xs">{4 - Math.min(4,missing(c).length)}/4 steps</span></> }
  function badge(c: Course) { return <span className="studio-status"><span className={c.published && !c.archived ? 'is-published' : ''}/>{status(c)}</span> }
  return <>
    <div className="studio-heading"><div className="flex flex-wrap items-baseline gap-3"><h1>Your courses</h1><span className="ef-muted">{loading ? 'Loading…' : `${courses.length} course${courses.length === 1 ? '' : 's'}`}</span></div><div className="flex gap-2"><Button className="studio-secondary" disabled={picked.length !== 1 || busy} title="Select one course to duplicate" onClick={() => duplicate(picked[0])}>Duplicate</Button><Button className="studio-primary" onClick={() => setCreate(true)}>+ New course</Button></div></div>
    <dl className="studio-stats">{[['Student enrollments',courses.reduce((n,c)=>n+(c.enrollmentCount||0),0)],['Published courses',courses.filter(c=>c.published&&!c.archived).length],['Drafts',courses.filter(c=>!c.published&&!c.archived).length],['Average rating',average]].map(([label,value])=><div key={label}><dt>{label}</dt><dd>{loading ? <span className="studio-skeleton inline-block h-6 w-12"/> : value}</dd></div>)}</dl>
    <div className="studio-segments" aria-label="Course status">{['All','Published','Draft','Archived'].map(t=><Button key={t} aria-pressed={tab===t} onClick={()=>setTab(t)}>{t}<span>{courses.filter(c=>t==='All'||status(c)===t).length}</span></Button>)}</div>
    <div className="studio-toolbar"><label className="studio-search"><span className="sr-only">Search your courses</span><input ref={searchRef} value={q} onChange={e=>setQ(e.target.value)} placeholder="Search courses"/><kbd>/</kbd></label><label className="sr-only" htmlFor="studio-category">Program</label><select id="studio-category" className="studio-select" value={category} onChange={e=>setCategory(e.target.value)}><option value="">All programs</option>{categories.map(c=><option key={c}>{c}</option>)}</select><label className="sr-only" htmlFor="studio-sort">Sort courses</label><select id="studio-sort" className="studio-select" value={sort} onChange={e=>setSort(e.target.value)}><option value="updated">Recently updated</option><option value="name">Name</option><option value="students">Students</option><option value="rating">Rating</option></select><div className="flex"><Button className="studio-icon" aria-label="Table view" aria-pressed={!grid} onClick={()=>setGrid(false)}>☰</Button><Button className="studio-icon" aria-label="Grid view" aria-pressed={grid} onClick={()=>setGrid(true)}>▦</Button><Button className="studio-help" aria-label="Keyboard shortcuts" onClick={()=>setShortcuts(true)}>Help</Button></div></div>
    {(error || failure) && <div role="alert" className="studio-error my-4">{failure || error} <Button className="studio-ghost" onClick={()=>{setFailure('');void reload().catch(e=>setFailure(e.message))}}>Retry</Button></div>}
    <div role="status" aria-live="polite" className={notice ? 'studio-notice' : 'sr-only'}>{notice}{undo.length>0 && <Button className="studio-ghost" disabled={busy} onClick={restore}>Undo archive</Button>}</div>
    {loading ? <div className="studio-table-wrap" aria-label="Loading courses" aria-busy="true">{Array.from({length:5},(_,i)=><div key={i} className="studio-loading-row"><span className="studio-skeleton h-12 w-12"/><span className="studio-skeleton h-4 w-1/3"/><span className="studio-skeleton ml-auto h-4 w-16"/></div>)}</div> : !courses.length ? <div className="studio-empty"><h2>You haven’t created a course yet.</h2><p className="ef-muted mt-2">Create → Add lessons → Publish</p><Button className="studio-primary mt-5" onClick={()=>setCreate(true)}>New course</Button></div> : !filtered.length ? <div className="studio-empty"><h2>No courses match {q ? `“${q}”` : 'your filters'}.</h2><Button className="studio-ghost mt-3" onClick={()=>{setQ('');setTab('All');setCategory('')}}>Clear filters</Button></div> : grid ? <div className="studio-grid">{visible.map(c=><article key={c.id} className="studio-grid-card"><div className="studio-generated-cover" aria-hidden>{c.category.slice(0,2)}</div><div className="p-4"><div className="flex justify-between gap-3"><label><span className="sr-only">Select {c.title}</span><input type="checkbox" checked={selected.includes(c.id)} onChange={()=>select(c.id)}/></label>{badge(c)}<Button className="studio-icon" disabled={busy} aria-label={`Actions for ${c.title}`} onClick={()=>setActions(c)}>⋯</Button></div>{courseTitle(c)}<p className="ef-muted my-3">{c.enrollmentCount||0} students · {c.lessonCount ? `${c.lessonCount} lesson${c.lessonCount===1?'':'s'}`:'No lessons yet'}</p><div className="flex items-center justify-between"><span>{(c.description.includes('awaiting confirmation.') ? 'Price pending' : formatPrice(c.priceCents))}</span>{contextual(c)}</div></div></article>)}</div> : <div className="studio-table-wrap"><table className="studio-table"><thead><tr><th><input type="checkbox" aria-label="Select courses on this page" checked={visible.length>0&&visible.every(c=>selected.includes(c.id))} onChange={e=>setSelected(ids=>e.target.checked?Array.from(new Set([...ids,...visible.map(c=>c.id)])):ids.filter(id=>!visible.some(c=>c.id===id)))}/></th><th><Button onClick={()=>setSort('name')}>Course {sort==='name'?'↓':''}</Button></th><th>Status</th><th><Button onClick={()=>setSort('students')}>Students {sort==='students'?'↓':''}</Button></th><th>Lessons</th><th><Button onClick={()=>setSort('rating')}>Rating {sort==='rating'?'↓':''}</Button></th><th>Price</th><th><Button onClick={()=>setSort('updated')}>Updated {sort==='updated'?'↓':''}</Button></th><th><span className="sr-only">Actions</span></th></tr></thead><tbody ref={rowsRef}>{visible.map(c=><tr key={c.id} data-course={c.id} tabIndex={0} onClick={e=>{if(!(e.target as HTMLElement).closest('a,button,input,form,label')) void router.push(`/tutor/courses/${c.id}`)}} onKeyDown={e=>{if(e.key==='Enter'&&e.target===e.currentTarget) void router.push(`/tutor/courses/${c.id}`)}}><td><input type="checkbox" aria-label={`Select ${c.title}`} checked={selected.includes(c.id)} onChange={()=>select(c.id)}/></td><td><div className="flex items-start gap-3"><div>{courseTitle(c)}</div></div></td><td data-label="Status">{badge(c)}</td><td data-label="Students">{c.enrollmentCount||0}</td><td data-label="Lessons">{c.lessonCount || <span className="ef-muted">—</span>}</td><td data-label="Rating">{c.avgRating!=null?`★ ${c.avgRating.toFixed(1)}`:'—'}</td><td data-label="Price">{(c.description.includes('awaiting confirmation.') ? 'Price pending' : formatPrice(c.priceCents))}</td><td data-label="Updated"><time dateTime={c.updatedAt} title={c.updatedAt?new Date(c.updatedAt).toLocaleString():undefined}>{relative(c.updatedAt)}</time></td><td><div className="studio-row-actions flex items-center justify-end gap-1"><Button className="studio-icon" aria-label={`Actions for ${c.title}`} disabled={busy} onClick={()=>setActions(c)}>Manage →</Button></div></td></tr>)}</tbody></table></div>}
    {!loading && filtered.length>0 && <footer className="studio-pagination"><span>Showing {(current-1)*size+1}–{Math.min(current*size,filtered.length)} of {filtered.length}</span><label>Rows per page <select className="studio-select" value={size} onChange={e=>setSize(Number(e.target.value))}>{[10,25,50].map(n=><option key={n}>{n}</option>)}</select></label><div><Button className="studio-ghost" disabled={current<=1} onClick={()=>setPage(current-1)}>Previous</Button><Button className="studio-ghost" disabled={current>=pages} onClick={()=>setPage(current+1)}>Next</Button></div></footer>}
    {selected.length>0 && <div className="studio-bulk" aria-label="Bulk course actions"><strong>{selected.length} selected</strong><Button className="studio-ghost" disabled={busy} onClick={()=>update(picked,{published:true})}>Publish</Button><Button className="studio-ghost" disabled={busy} onClick={()=>update(picked,{archived:true},true)}>Archive</Button><Button className="studio-ghost" disabled={busy} onClick={()=>setCategoryDialog(true)}>Change program</Button><Button className="studio-ghost studio-danger" disabled={busy} onClick={()=>askDelete(picked)}>Delete</Button><Button className="studio-icon" aria-label="Clear selection" onClick={()=>setSelected([])}>×</Button></div>}
    {create && <QuickCreate close={()=>setCreate(false)} categories={categories}/>}
    {shortcuts && <StudioDialog title="Keyboard shortcuts" close={()=>setShortcuts(false)}><dl className="studio-shortcuts">{[['/','Search courses'],['n','New course'],['j / k','Focus next / previous table row'],['Enter','Open focused course'],['Esc','Clear selection or close dialog'],['?','Show shortcuts']].map(([key,label])=><div key={key}><dt><kbd>{key}</kbd></dt><dd>{label}</dd></div>)}</dl></StudioDialog>}
    {actions && <StudioDialog title={actions.title} close={()=>setActions(null)}><div className="studio-action-list"><Link href={`/tutor/courses/${actions.id}`}>Manage</Link><Link href={`/tutor/courses/${actions.id}#details`}>Edit details</Link><Link href={`/tutor/courses/${actions.id}#lessons`}>Add or edit lessons</Link><Button disabled={busy||actions.archived} onClick={()=>{const c=actions;setActions(null);void update([c],{published:!c.published})}}>{actions.published?'Unpublish course':'Publish course'}</Button><Button onClick={()=>duplicate(actions)}>Duplicate course and lessons</Button><Link href={`/courses/${actions.id}`}>Preview course page</Link><Button onClick={()=>{const c=actions;setActions(null);void update([c],{archived:!c.archived},!c.archived)}}>{actions.archived?'Restore to drafts':'Archive'}</Button><Button className="studio-danger" onClick={()=>askDelete([actions])}>Delete permanently</Button></div></StudioDialog>}
    {deleting.length>0 && <StudioDialog title={`Delete ${deleting.length===1?'course':`${deleting.length} courses`}?`} busy={busy} close={()=>setDeleting([])}><p className="ef-muted my-4">This permanently removes the selected courses and their lessons, enrollments and related records. This cannot be undone.</p><ul className="mb-4 list-disc pl-5">{deleting.map(c=><li key={c.id}>{c.title}</li>)}</ul>{deleting.filter(c=>(c.enrollmentCount||0)>0).map(c=><label key={c.id} className="studio-field my-4">Type “{c.title}” to confirm<input className="ef-input" autoComplete="off" value={confirmNames[c.id]||''} onChange={e=>setConfirmNames(v=>({...v,[c.id]:e.target.value}))}/></label>)}<div className="flex justify-end gap-2"><Button className="studio-secondary" disabled={busy} onClick={()=>setDeleting([])}>Cancel</Button><Button className="studio-delete" disabled={busy||deleting.some(c=>(c.enrollmentCount||0)>0&&confirmNames[c.id]!==c.title)} onClick={remove}>{busy?'Deleting…':'Delete permanently'}</Button></div></StudioDialog>}
    {categoryDialog && <StudioDialog title="Change program" close={()=>setCategoryDialog(false)}><form className="mt-5" onSubmit={e=>{e.preventDefault();const data=new FormData(e.currentTarget);setCategoryDialog(false);void update(picked,{category:String(data.get('program')).trim()})}}><label className="studio-field">Program<input name="program" className="ef-input" required minLength={2} list="bulk-programs"/><datalist id="bulk-programs">{categories.map(c=><option key={c}>{c}</option>)}</datalist></label><Button className="studio-primary mt-5">Update {picked.length} courses</Button></form></StudioDialog>}
  </>
}
