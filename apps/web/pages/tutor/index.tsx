import {Button} from '../../components/Button'
import {AssignedTasks} from '../../components/tutor/AssignedTasks'
import { useRouter } from 'next/router'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import DocumentHead from '../../components/DocumentHead'
import { RequireRole } from '../../components/RequireRole'
import { api, Course } from '../../lib/api'
import { CourseStudio } from '../../components/tutor/CourseStudio'
import { PageHeader } from '../../components/admin/Workspace'
import { TutorLiveClasses } from '../../components/tutor/TutorLiveClasses'

export default function TutorDeskPage() {
  return <RequireRole roles={['Tutor','Admin']}>{()=> <TutorDesk/>}</RequireRole>
}
function TutorDesk() {
  const router = useRouter()
  useEffect(() => { if (router.isReady && router.query.tab === 'live') setTab('Live classes') }, [router.isReady, router.query.tab])
  const [courses,setCourses] = useState<Course[]>([])
  const [loading,setLoading] = useState(true), [error,setError] = useState(''), [tab,setTab] = useState('Courses')
  async function reload() { try { const c=await api.taughtCourses();setCourses(c);setError('') } catch(e) {setError(e instanceof Error?e.message:'Could not load courses');throw e} finally {setLoading(false)} }
  useEffect(()=>{void reload().catch(()=>{})},[])
  return <><DocumentHead title="Creator studio — EchoFreelance Tech School"/><main className="admin-workspace studio"><AssignedTasks/>
    <PageHeader title="Tutor studio" description="Your courses, live classes and students." actions={<Link className="adm-button-secondary" href="/settings">Settings</Link>}/>
    <nav className="studio-subnav ef-workspace-nav" aria-label="Tutor studio">{['Courses','Live classes','Students','Earnings'].map(t=><Button key={t} aria-current={tab===t?'page':undefined} onClick={()=>setTab(t)}>{t}</Button>)}</nav>
    {tab==='Courses' && <CourseStudio courses={courses} setCourses={setCourses} loading={loading} error={error} reload={reload}/>}
    {tab==='Live classes' && <TutorLiveClasses courses={courses}/>}
    {tab==='Students' && <><div className="studio-heading"><h1>Students</h1></div><p className="ef-muted mb-6">Open a course to view its student roster, submissions and progress.</p><div className="studio-table-wrap"><ul className="studio-rosters">{courses.filter(c=>(c.enrollmentCount||0)>0).map(c=><li key={c.id}><Link href={`/tutor/courses/${c.id}#students`}>{c.title}<span>{c.enrollmentCount} student{c.enrollmentCount===1?'':'s'} →</span></Link></li>)}</ul>{!courses.some(c=>(c.enrollmentCount||0)>0)&&<p className="p-6 ef-muted">{loading?'Loading enrollments…':error?'Could not load enrollments. Return to Courses and retry.':'No enrolled students yet.'}</p>}</div></>}
    {tab==='Earnings' && <><div className="studio-heading"><h1>Earnings</h1></div><p className="ef-muted max-w-xl">Payment reporting is not connected yet. Course prices are not recorded revenue. Once a payment provider is integrated, verified transactions can appear here.</p></>}
  </main></>
}
