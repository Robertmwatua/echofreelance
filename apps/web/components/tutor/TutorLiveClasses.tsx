import {Button,NavigationLink} from '../Button'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { FormEvent, useEffect, useState } from 'react'
import { api, Course, formatWhen, VirtualClass } from '../../lib/api'
export function TutorLiveClasses({ courses }: { courses: Course[] }) {
 const router = useRouter()
 const [classes,setClasses] = useState<VirtualClass[]>([])
 const [error,setError] = useState('')
 const [instantCourseId,setInstantCourseId] = useState(courses.find(c=>!c.archived)?.id || '')
 const [instantTitle,setInstantTitle] = useState('')
 const [instantDuration,setInstantDuration] = useState(60)
 const [starting,setStarting] = useState(false)
 const [liveOk,setLiveOk] = useState<boolean|null>(null)
 async function load() { try {setClasses(await api.myClasses());setError('')} catch(e) {setError(e instanceof Error?e.message:'Could not load classes')} }
 useEffect(()=>{void load(); api.liveClassroomStatus().then(s=>setLiveOk(s.configured)).catch(()=>setLiveOk(null))},[])
 useEffect(()=>{if(!instantCourseId&&courses.length)setInstantCourseId(courses.find(c=>!c.archived)?.id||'')},[courses,instantCourseId])
  async function startInstant(e: FormEvent) {
    e.preventDefault()
    if (!instantCourseId) {
      setError('Create a course first, then start an instant meeting under it.')
      return
    }
    setStarting(true)
    setError('')
    try {
      const meeting = await api.startInstantMeeting({
        courseId: instantCourseId,
        title: instantTitle.trim() || undefined,
        durationMinutes: instantDuration,
      })
      router.push(`/classes/${meeting.id}/room`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not start meeting')
      setStarting(false)
    }
  }


 return <><div className="studio-heading"><h1>Live classes</h1><Link className="studio-primary" href="/tutor/classes/new">Schedule class</Link></div>        <section id="instant-class" className="studio-live-section">
          <h2 className="font-display text-2xl text-ink">Start instant meeting</h2>
          <p className="ef-muted mt-2 text-sm">
            Goes live immediately and opens the classroom. Enrolled students can join from Live
            classes.
          </p>
          {liveOk === false && <p className="studio-error mt-4" role="alert">Live video is not configured. Contact the school administrator before starting a session.</p>}
          {courses.length === 0 ? (
            <p className="mt-4 text-sm ef-muted">
              You need a course first.{' '}
              <Link href="/tutor/courses/new" className="text-fern hover:underline">
                Create one →
              </Link>
            </p>
          ) : (
            <form onSubmit={startInstant} className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <label className="block text-sm sm:col-span-2 lg:col-span-1">
                <span className="mb-1 block font-medium">Course</span>
                <select
                  required
                  className="ef-input"
                  value={instantCourseId}
                  onChange={(e) => setInstantCourseId(e.target.value)}
                >
                  {courses.filter(c=>!c.archived).map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.title}
                    </option>
                  ))}
                </select>
              </label>
              <label className="block text-sm sm:col-span-2 lg:col-span-1">
                <span className="mb-1 block font-medium">Title (optional)</span>
                <input
                  className="ef-input"
                  placeholder="e.g. Office hours"
                  value={instantTitle}
                  onChange={(e) => setInstantTitle(e.target.value)}
                />
              </label>
              <label className="block text-sm">
                <span className="mb-1 block font-medium">Duration</span>
                <select
                  className="ef-input"
                  value={instantDuration}
                  onChange={(e) => setInstantDuration(Number(e.target.value))}
                >
                  <option value={30}>30 min</option>
                  <option value={60}>60 min</option>
                  <option value={90}>90 min</option>
                  <option value={120}>2 hours</option>
                </select>
              </label>
              <div className="flex items-end">
                <Button type="submit" disabled={starting || liveOk === false} className="ef-btn w-full">
                  {starting ? 'Starting…' : 'Start now'}
                </Button>
              </div>
            </form>
          )}
        </section>

{error && <p className="studio-error" role="alert">{error} <Button className="studio-ghost" onClick={load}>Retry</Button></p>}        <section className="mt-12">
          <h2 className="font-display text-2xl text-ink">Your live classes</h2>
          <ul className="mt-4 grid gap-3 sm:grid-cols-2">
            {classes.map((item) => (
              <li key={item.id} className="ef-session-card !py-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="text-xs ef-muted">
                      {item.status} · {formatWhen(item.startsAt)}
                    </p>
                    <Link
                      href={`/classes/${item.id}`}
                      className="mt-1 block font-display text-xl hover:text-ink"
                    >
                      {item.title}
                    </Link>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {item.status === 'Live' && (
                      <Link href={`/classes/${item.id}/room`} className="ef-btn !py-2 text-xs">
                        Rejoin
                      </Link>
                    )}
                    <NavigationLink href={`/classes/${item.id}`} className="ef-btn-ghost !py-2 text-xs">
                      Roster
                    </NavigationLink>
                  </div>
                </div>
              </li>
            ))}
          </ul>
          {classes.length === 0 && (
            <p className="mt-4 ef-muted">No sessions yet — start an instant meeting above.</p>
          )}
        </section>
</>
}
