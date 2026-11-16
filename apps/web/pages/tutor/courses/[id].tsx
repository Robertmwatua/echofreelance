import {QuizEditor} from '../../../components/learning/QuizEditor'
import {Button,NavigationLink} from '../../../components/Button'
import { LessonEditor } from '../../../components/tutor/LessonEditor'
import { CourseFeeEditor } from '../../../components/CourseFeeEditor'
import { RoadmapEditor, roadmapLines } from '../../../components/tutor/RoadmapEditor'
import { useConfirmation } from '../../../components/Confirmation'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { FormEvent, useEffect, useState, useRef } from 'react'
import {Field,Panel,Notice} from '../../../components/forms/Fields'
import {formatKes} from '../../../lib/api'
import DocumentHead from '../../../components/DocumentHead'
import { CategoryField } from '../../../components/CategoryField'
import { RequireRole } from '../../../components/RequireRole'
import { api, CATEGORIES, Course, CourseStudentReport } from '../../../lib/api'

export default function TutorCourseManagePage() {
  return (
    <RequireRole roles={['Tutor', 'Admin']}>
      {() => <ManageCourse />}
    </RequireRole>
  )
}

function ManageCourse() {
  const { confirm, confirmation } = useConfirmation()
  const router = useRouter()
  const id = typeof router.query.id === 'string' ? router.query.id : ''
  const [course, setCourse] = useState<Course | null>(null)
  const [report, setReport] = useState<CourseStudentReport | null>(null)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [busy, setBusy] = useState(false)

  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [category, setCategory] = useState('Cybersecurity')
  const [level, setLevel] = useState('Beginner')
  const [roadmap, setRoadmap] = useState('')
  const [publicPreview, setPublicPreview] = useState(false)
  const [published, setPublished] = useState(false)

  const [lessonTitle, setLessonTitle] = useState('')
  const [lessonContent, setLessonContent] = useState('')
  const [lessonMinutes, setLessonMinutes] = useState(30)
  const [assignTitle, setAssignTitle] = useState('')
  const [assignInstructions, setAssignInstructions] = useState('')
  const [assignDue,setAssignDue]=useState(''),[assignMax,setAssignMax]=useState(100),[assignRequired,setAssignRequired]=useState(false),[assignPass,setAssignPass]=useState(50)
  const [announceTitle, setAnnounceTitle] = useState('')
  const [announceBody, setAnnounceBody] = useState('')
  const [resourceLessonId, setResourceLessonId] = useState('')
  const [resourceTitle, setResourceTitle] = useState('')
  const [resourceUrl, setResourceUrl] = useState('')
  const [notifyTitle, setNotifyTitle] = useState('')
  const [notifyBody, setNotifyBody] = useState('')
  const [savedSignature,setSavedSignature]=useState(''),[savedAt,setSavedAt]=useState(''),[touched,setTouched]=useState<Record<string,boolean>>({})
  const loadedId=useRef(''),saving=useRef(false)
  const [knownCategories, setKnownCategories] = useState<string[]>([])

  async function load() {
    if (!id) return
    const [data, students, taught, catalog] = await Promise.all([
      api.course(id),
      api.courseStudents(id).catch(() => null),
      api.taughtCourses().catch(() => [] as Course[]),
      api.courses().catch(() => [] as Course[]),
    ])
    setCourse(data)
    setReport(students)
    if(loadedId.current!==id){
    loadedId.current=id
    setSavedAt(data.updatedAt||'')
    setSavedSignature(JSON.stringify({title:data.title,description:data.description,category:data.category||'Cybersecurity',level:data.level,roadmap:(data.roadmap||[]).join('\n'),publicPreview:Boolean(data.publicPreview),published:data.published}))
    setTitle(data.title)
    setDescription(data.description)
    setCategory(data.category || 'Cybersecurity')
    setLevel(data.level)
    setPublished(data.published)
    setRoadmap((data.roadmap || []).join('\n'))
    setPublicPreview(Boolean(data.publicPreview))
    }
    const cats = [...taught, ...catalog].map((c) => c.category).filter(Boolean)
    setKnownCategories(Array.from(new Set(cats)))
  }

  useEffect(() => {
    load().catch((e: Error) => setError(e.message))
  }, [id])

  const signature=JSON.stringify({title,description,category,level,roadmap,publicPreview,published})
  const dirty=!!course&&signature!==savedSignature
  const draftValid=title.trim().length>=3&&description.trim().length>=10&&category.trim().length>=2&&roadmapLines(roadmap).length<=24&&roadmapLines(roadmap).every(s=>s.length>=3&&s.length<=180)
  const canPublish=draftValid&&!!course?.lessons?.some(l=>l.published)&&!course?.archived
  const saveRef=useRef<(e?:FormEvent,publish?:boolean)=>Promise<void>>()
  async function saveCourse(e?:FormEvent,publish?:boolean){
    e?.preventDefault();if(saving.current)return
    setTouched({title:true,description:true,category:true})
    if(!draftValid){setError('Check the title, description, category and roadmap before saving.');return}
    saving.current=true;setBusy(true);setError('');setMessage('')
    const nextPublished=publish??published
    const snapshot=JSON.stringify({title,description,category,level,roadmap,publicPreview,published:nextPublished})
    try{const result=await api.updateCourse(id,{title,description,category:category.trim(),level,roadmapSteps:roadmapLines(roadmap),publicPreview,published:nextPublished!==course?.published?nextPublished:undefined});setCourse(old=>old?{...old,...result,priceCents:old.priceCents,lessons:old.lessons}:result);setPublished(nextPublished);setSavedSignature(snapshot);setSavedAt(new Date().toISOString());setMessage('Changes saved.')}
    catch(e){setError(e instanceof Error?e.message:'Could not save. Retry.')}finally{saving.current=false;setBusy(false)}
  }
  saveRef.current=saveCourse
  useEffect(()=>{if(!dirty||!draftValid||busy||error||course?.published||published!==course?.published)return;const timer=setTimeout(()=>void saveRef.current?.(),1800);return()=>clearTimeout(timer)},[signature,dirty,draftValid,busy,error,course?.published])
  useEffect(()=>{function key(e:KeyboardEvent){if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==='s'){e.preventDefault();void saveRef.current?.()}}window.addEventListener('keydown',key);return()=>window.removeEventListener('keydown',key)},[])
  useEffect(()=>{if(!dirty)return;function leave(e:BeforeUnloadEvent){e.preventDefault();e.returnValue=''};function change(url:string){if(url===router.asPath)return;if(!window.confirm('Leave with unsaved course changes?')){router.events.emit('routeChangeError');throw new Error('Navigation cancelled: unsaved course changes.')}}window.addEventListener('beforeunload',leave);router.events.on('routeChangeStart',change);return()=>{window.removeEventListener('beforeunload',leave);router.events.off('routeChangeStart',change)}},[dirty,router])

  async function addLesson(e: FormEvent) {
    e.preventDefault()
    setBusy(true)
    setError('')
    setMessage('')
    try {
      await api.addLesson(id, {
        title: lessonTitle,
        content: lessonContent,
        durationMinutes: lessonMinutes,
      })
      setLessonTitle('')
      setLessonContent('')
      await load()
      setMessage('Draft lesson added. Edit and publish it when ready.')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not add lesson')
    } finally {
      setBusy(false)
    }
  }

  async function addAssignment(e: FormEvent) {
    e.preventDefault()
    setBusy(true)
    setError('')
    setMessage('')
    try {
      await api.createAssignment({
        courseId: id,
        title: assignTitle,
        instructions: assignInstructions,
        dueAt:assignDue?new Date(assignDue).toISOString():undefined,
        maxPoints:assignMax,requiredForCertificate:assignRequired,passPercent:assignPass,
      })
      setAssignTitle('')
      setAssignInstructions('')
      setMessage('Assignment published.')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not create assignment')
    } finally {
      setBusy(false)
    }
  }

  async function postAnnouncement(e: FormEvent) {
    e.preventDefault()
    setBusy(true)
    setError('')
    setMessage('')
    try {
      await api.createAnnouncement({
        courseId: id,
        title: announceTitle,
        body: announceBody,
      })
      setAnnounceTitle('')
      setAnnounceBody('')
      setMessage('Announcement sent to enrolled students.')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not post announcement')
    } finally {
      setBusy(false)
    }
  }

  async function addResource(e: FormEvent) {
    e.preventDefault()
    setBusy(true)
    setError('')
    setMessage('')
    try {
      await api.addResource({
        lessonId: resourceLessonId,
        title: resourceTitle,
        url: resourceUrl,
      })
      setResourceTitle('')
      setResourceUrl('')
      await load()
      setMessage('Resource added to lesson.')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not add resource')
    } finally {
      setBusy(false)
    }
  }

  async function sendNotify(e: FormEvent) {
    e.preventDefault()
    setBusy(true)
    setError('')
    setMessage('')
    try {
      const res = await api.notifyCourse(id, {
        title: notifyTitle,
        body: notifyBody,
      })
      setNotifyTitle('')
      setNotifyBody('')
      setMessage(`Notification sent to ${res.notified} student(s).`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not send notification')
    } finally {
      setBusy(false)
    }
  }

  async function deleteCourse() {
    if (!await confirm('Delete this course and all its lessons, classes, and enrollments?')) {
      return
    }
    setBusy(true)
    setError('')
    try {
      await api.deleteCourse(id)
      router.push('/tutor')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not delete course')
      setBusy(false)
    }
  }

  return <>{confirmation}<DocumentHead title={course?`Edit ${course.title}`:'Course editor'}/><main className="ef-course-editor ef-staff-form">
    <nav className="ef-editor-breadcrumb" aria-label="Breadcrumb"><Link href="/tutor">Tutor desk</Link><span>/</span><span>{course?.title||'Course'}</span><span>/ Edit</span></nav>
    <header className="ef-editor-heading"><h1>Edit the course.</h1><span className="ef-pill">{course?.published?'Published':'Draft'}</span></header>
    {!course&&!error&&<p role="status">Loading course and lessons…</p>}{error&&<div role="alert" className="ef-toast mb-6"><strong>Couldn’t save or load changes.</strong><p className="mt-2">{error}</p><Button className="admin-secondary mt-4" disabled={busy} onClick={()=>course?void saveCourse():void load().catch(e=>setError(e.message))}>Retry</Button></div>}
    {course&&<div className="ef-editor-grid"><div className="ef-editor-main">
      <form id="course-details" onSubmit={saveCourse}><Panel number="01" title="Basics"><fieldset disabled={busy} className="ef-field-stack"><Field label="Course title" error={touched.title&&title.trim().length<3?'Use at least 3 characters.':undefined}><input className="ef-input" required minLength={3} maxLength={200} value={title} onBlur={()=>setTouched(t=>({...t,title:true}))} onChange={e=>setTitle(e.target.value)}/></Field><Field label="Description" hint={`${description.length}/${Math.max(500,course.description.length)} characters · Tell students what they will practise.`} error={touched.description&&description.trim().length<10?'Describe the course in at least 10 characters.':undefined}><textarea className="ef-input" required minLength={10} maxLength={Math.max(500,course.description.length)} rows={4} value={description} onBlur={()=>setTouched(t=>({...t,description:true}))} onChange={e=>setDescription(e.target.value)}/></Field><div className="grid sm:grid-cols-2 gap-6"><Field label="Category" hint="Pick a suggestion or type a custom category."><CategoryField value={category} onChange={setCategory} suggestions={[...CATEGORIES,...knownCategories]}/></Field><Field label="Level"><select className="ef-input" value={level} onChange={e=>setLevel(e.target.value)}><option>Beginner</option><option>Intermediate</option><option>Advanced</option></select></Field></div></fieldset></Panel></form>
      <Panel number="02" title="Pricing and visibility" aside={<span className="ef-pill">{course.published?'Published':'Draft'}</span>}><Notice label="Fees">Set and confirmed by an administrator, in KES.{course.feeConfirmed?` Current tuition: ${formatKes(course.priceCents)}.`:' Awaiting confirmation.'}</Notice><p className="ef-field-hint mt-5">{course.published?'Changes to this published course are saved only when you choose Save changes.':'Valid draft changes autosave after you pause typing.'}</p><p className="ef-field-hint mt-3">Cover uploads are not connected to this course model. No image upload is available yet.</p><details className="mt-5"><summary>Edit tuition, discount and access deposit</summary><CourseFeeEditor course={course} updated={load}/></details></Panel>
      <Panel number="03" title="Learning roadmap" aside={<span className="ef-meta">{course.lessons?.length||0} lessons</span>} id="lessons"><RoadmapEditor value={roadmap} change={setRoadmap} listed={publicPreview} setListed={setPublicPreview}/><h3 className="text-2xl font-bold mt-8">Ordered lessons</h3><LessonEditor courseId={id} lessons={course.lessons||[]} refresh={load}/><details className="ef-editor-add mt-6"><summary className="admin-secondary">+ Add lesson</summary><form onSubmit={addLesson} className="ef-field-stack mt-6"><Field label="Lesson title"><input className="ef-input" required minLength={3} maxLength={200} value={lessonTitle} onChange={e=>setLessonTitle(e.target.value)}/></Field><Field label="Teaching notes / lab brief"><textarea className="ef-input" required minLength={10} maxLength={50000} rows={6} value={lessonContent} onChange={e=>setLessonContent(e.target.value)}/></Field><Field label="Duration / minutes"><input className="ef-input" required type="number" min={1} max={1440} value={lessonMinutes} onChange={e=>setLessonMinutes(Number(e.target.value))}/></Field><Button className="admin-secondary" disabled={busy}>Add draft lesson</Button></form></details></Panel>
      <Panel number="04" title="Students and teaching tools"><details><summary>Student performance / {report?.studentCount??'…'} enrolled</summary>{report?.students.length?<div className="ef-table-scroll mt-5"><table className="ef-data-table"><thead><tr><th>Student</th><th>Progress</th><th>Attendance</th><th>Assignments</th><th>Average grade</th></tr></thead><tbody>{report.students.map(s=><tr key={s.id}><td>{s.name||'Student'}<p className="ef-meta">{s.email}</p></td><td>{s.progressPercent}% ({s.lessonsCompleted}/{s.lessonsTotal})</td><td>{s.attendancePercent==null?'—':`${s.attendancePercent}%`}</td><td>{s.assignmentsSubmitted}/{s.assignmentsTotal}</td><td>{s.avgGrade??'—'}</td></tr>)}</tbody></table></div>:<p className="ef-field-hint mt-4">No students yet. Publish reviewed lessons and confirm fees before inviting enrolments.</p>}</details>
      <details className="mt-6"><summary>Add lesson resource</summary><form onSubmit={addResource} className="ef-field-stack mt-5"><Field label="Lesson"><select className="ef-input" required value={resourceLessonId} onChange={e=>setResourceLessonId(e.target.value)}><option value="">Select a lesson</option>{course.lessons?.map(l=><option key={l.id} value={l.id}>{l.title}</option>)}</select></Field><Field label="Resource title"><input className="ef-input" required value={resourceTitle} onChange={e=>setResourceTitle(e.target.value)}/></Field><Field label="HTTPS resource URL"><input className="ef-input" required type="url" value={resourceUrl} onChange={e=>setResourceUrl(e.target.value)}/></Field><Button className="admin-secondary" disabled={busy}>Add resource</Button></form></details>
      <details className="mt-6"><summary>Notify students / in-app alerts</summary><form onSubmit={sendNotify} className="ef-field-stack mt-5"><Field label="Notification title"><input className="ef-input" required value={notifyTitle} onChange={e=>setNotifyTitle(e.target.value)}/></Field><Field label="Message"><textarea className="ef-input" required rows={3} value={notifyBody} onChange={e=>setNotifyBody(e.target.value)}/></Field><Button className="admin-secondary" disabled={busy}>Send notification</Button></form></details>
      <details className="mt-6"><summary>Course announcements</summary><form onSubmit={postAnnouncement} className="ef-field-stack mt-5"><Field label="Announcement title"><input className="ef-input" required value={announceTitle} onChange={e=>setAnnounceTitle(e.target.value)}/></Field><Field label="Announcement"><textarea className="ef-input" required rows={3} value={announceBody} onChange={e=>setAnnounceBody(e.target.value)}/></Field><Button className="admin-secondary" disabled={busy}>Post announcement</Button></form></details>
      <QuizEditor courseId={id} lessons={course.lessons||[]}/><details className="mt-6"><summary>Assignments & feedback</summary><Link className="ef-navigation-link mt-3" href={`/courses/${id}#assignments`}>View assignments and review submissions →</Link><form onSubmit={addAssignment} className="ef-field-stack mt-5"><Field label="Assignment title"><input className="ef-input" required value={assignTitle} onChange={e=>setAssignTitle(e.target.value)}/></Field><Field label="Instructions"><textarea className="ef-input" required rows={3} value={assignInstructions} onChange={e=>setAssignInstructions(e.target.value)}/></Field><Field label="Due date (optional)"><input className="ef-input" type="datetime-local" value={assignDue} onChange={e=>setAssignDue(e.target.value)}/></Field><Field label="Maximum points"><input className="ef-input" type="number" min={1} max={1000} required value={assignMax} onChange={e=>setAssignMax(Number(e.target.value))}/></Field><label className="learning-answer"><input type="checkbox" checked={assignRequired} onChange={e=>setAssignRequired(e.target.checked)}/>Required for certificate</label>{assignRequired&&<Field label="Pass mark (%)"><input className="ef-input" type="number" min={1} max={100} required value={assignPass} onChange={e=>setAssignPass(Number(e.target.value))}/></Field>}<Button className="admin-secondary" disabled={busy}>Publish assignment</Button></form></details></Panel>
      <Panel title="Course controls"><p className="ef-field-hint">Deleting a course removes its teaching records. Courses with financial records must be archived instead.</p><Button className="ef-btn-ghost ef-text-danger mt-4" disabled={busy} onClick={deleteCourse}>Delete course</Button></Panel>
    </div><aside className="ef-course-summary"><Panel title="Course summary" aside={<span className="ef-pill">{course.published?'Published':'Draft'}</span>}><p className="ef-meta break-all">{id}</p><p role="status" className="ef-save-state mt-4">{busy?'Saving…':error?'Couldn’t save. Retry.':dirty?'Unsaved changes':savedAt?`Saved ${new Date(savedAt).toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'})}`:'Ready to edit'}</p><ul className="ef-completeness mt-5">{[[title.trim().length>=3,'Title'],[description.trim().length>=10,'Description'],[!!course.lessons?.some(l=>l.published),'At least 1 published lesson'],[!!level,'Level']].map(([ok,label])=><li key={String(label)}><span>{label}</span><strong>{ok?'✓':'✗'}</strong></li>)}</ul><Button className="ef-btn w-full mt-6" loading={busy} loadingLabel="Saving…" disabled={busy||!dirty} onClick={()=>void saveCourse()}>Save changes</Button><p className="ef-field-hint mt-2">{!dirty?'All course details are saved.':'Ctrl / ⌘ S to save.'}</p><NavigationLink href={`/courses/${id}`} className="admin-secondary w-full mt-4">Preview as student →</NavigationLink><Button className="ef-btn-ghost mt-4" disabled={busy||(!course.published&&!canPublish)} onClick={()=>void saveCourse(undefined,!course.published)}>{course.published?'Move course to draft':'Publish course'}</Button>{!course.published&&!canPublish&&<p className="ef-field-hint mt-2">Complete the fields and publish at least one lesson first. Archived courses must be restored.</p>}<p className="ef-field-hint mt-4">Staff preview uses your current account. Students see only published content.</p></Panel></aside>
    <div className="ef-editor-mobile-save"><span className="ef-meta" role="status">{busy?'Saving…':dirty?'Unsaved changes':'Saved'}</span><Button className="ef-btn" loading={busy} loadingLabel="Saving…" disabled={busy||!dirty} onClick={()=>void saveCourse()}>Save changes</Button></div></div>}{message&&<p role="status" className="ef-meta mt-5">{message}</p>}
  </main></>
}
