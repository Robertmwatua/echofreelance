import {Button} from '../../components/Button'
import { LiveDot } from '../../components/LiveDot'
import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import DocumentHead from '../../components/DocumentHead'
import { CardSkeletons, FeedbackCard, PageHero } from '../../components/PageFeedback'
import { api, CATEGORIES, classStatusLabel, formatWhen, googleCalendarUrl, VirtualClass } from '../../lib/api'

type Filter = 'All' | 'Live' | 'Upcoming'


export default function ClassesPage() {
  const [classes, setClasses] = useState<VirtualClass[]>([])
  const [error, setError] = useState(false)
  const [loading, setLoading] = useState(true)
  const [attempt, setAttempt] = useState(0)
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState('')
  const [filter, setFilter] = useState<Filter>('All')

  useEffect(() => {
    let active = true
    setLoading(true)
    setError(false)
    api.classes().then(data => { if (active) setClasses(data) })
      .catch(() => { if (active) setError(true) })
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [attempt])

  const categories = useMemo(() => Array.from(new Set([...CATEGORIES, ...classes.map(c => c.course?.category).filter((c): c is string => Boolean(c))])), [classes])
  const visible = useMemo(() => classes.filter(c => {
    const text = `${c.title} ${c.description || ''} ${c.host?.name || ''} ${c.course?.title || ''}`.toLowerCase()
    return text.includes(query.trim().toLowerCase()) && (!category || c.course?.category === category)
      && (filter === 'All' || (filter === 'Live' ? c.status === 'Live' : c.status === 'Scheduled' && new Date(c.endsAt).getTime() > Date.now()))
  }).sort((a, b) => Number(b.status === 'Live') - Number(a.status === 'Live') || new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime()), [classes, query, category, filter])
  const clear = () => { setQuery(''); setCategory(''); setFilter('All') }

  return <>
    <DocumentHead title="Live classes — EchoFreelance Tech School" />
    <main className="mx-auto max-w-6xl px-6 py-10 sm:py-12">
      <PageHero eyebrow="01 / Live classes" title="Pick a room. Bring a problem." description="A question, a screen share, a tutor who can help. Find your next live workshop here." />
      <section aria-label="Filter live classes" className="ef-toolbar mt-6">
        <div className="flex flex-1 flex-col gap-3 sm:flex-row"><input aria-label="Search live classes" placeholder="Search classes or tutors…" value={query} onChange={e => setQuery(e.target.value)} className="ef-input sm:min-w-0 sm:flex-1" /><select aria-label="Class category" value={category} onChange={e => setCategory(e.target.value)} className="ef-input sm:!w-56"><option value="">All categories</option>{categories.map(c => <option key={c}>{c}</option>)}</select></div>
        <div role="group" aria-label="Session status" className="flex flex-wrap gap-2">{(['All', 'Live', 'Upcoming'] as Filter[]).map(tab => <Button key={tab} aria-pressed={filter === tab} onClick={() => setFilter(tab)} className="ef-filter">{tab}</Button>)}</div>
      </section>
      {loading ? <CardSkeletons label="Loading live classes" /> : error ? <>
        <FeedbackCard error title="Unable to load live classes" description="We couldn’t connect to the classroom schedule. Check your connection or try again in a moment. Your filters will stay in place." retry={() => setAttempt(a => a + 1)} action={{ href: '/courses', label: 'Explore courses' }} />
      </> : visible.length ? <><p className="ef-meta mt-8" role="status">{visible.length} {visible.length === 1 ? 'session' : 'sessions'} to explore</p><ul className="mt-4 grid gap-6 md:grid-cols-2 lg:grid-cols-3">{visible.map(item => <li key={item.id} className="ef-session-card flex flex-col"><div className="flex items-center justify-between gap-3"><span className={item.status === 'Live' ? 'ef-pill-live' : 'ef-pill'}>{item.status === 'Live' && <LiveDot />}{classStatusLabel(item.status)}</span><span className="ef-meta">{item.course?.category || 'Live class'}</span></div><h2 className="mt-5 font-display text-2xl"><Link href={`/classes/${item.id}`} className="hover:underline underline-offset-4">{item.title}</Link></h2><p className="ef-muted mt-3 line-clamp-2 text-sm leading-6">{item.description || item.course?.title || 'A guided session with your learning community.'}</p><div className="mt-6 flex items-center gap-3"><span className="ef-avatar" aria-hidden="true">{(item.host?.name || 'Tutor').split(' ').slice(0, 2).map(w => w[0]).join('')}</span><div className="min-w-0"><p className="truncate text-sm font-semibold">{item.host?.name || 'Course tutor'}</p><p className="ef-meta">Session instructor</p></div></div><div className="my-6 border-y border-line py-4"><p className="ef-meta">{formatWhen(item.startsAt)}</p><p className="ef-meta mt-1">{Math.max(0, Math.round((new Date(item.endsAt).getTime() - new Date(item.startsAt).getTime()) / 60000))} minutes{item.attendanceCount != null ? ` · ${item.attendanceCount} registered` : ''}</p></div><div className="mt-auto flex flex-wrap gap-2"><Link href={`/classes/${item.id}`} className="ef-btn">{item.canEnterRoom ? 'Join session' : 'View session'}</Link><a href={googleCalendarUrl({ title: item.title, startsAt: item.startsAt, endsAt: item.endsAt, details: item.description || item.course?.title || '', location: 'EchoFreelance classroom' })} target="_blank" rel="noreferrer" className="ef-btn-ghost" aria-label={`Add ${item.title} to calendar`}>Calendar</a></div></li>)}</ul></> : <FeedbackCard title={classes.length ? 'No sessions match your filters' : 'No sessions scheduled yet.'} description={classes.length ? 'Try a different topic, category, or session status.' : 'Tutors are setting the next one. Browse a course meanwhile.'} action={{ href: '/courses', label: 'Explore courses' }} />}
      {!loading && !error && !visible.length && classes.length > 0 && <Button onClick={clear} className="ef-btn-ghost mt-4">Clear filters</Button>}
    </main>
  </>
}
