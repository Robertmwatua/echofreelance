import Image from 'next/image'
import {CourseSubjectIcon,subjectTone} from '../components/catalogue/CourseSubjectIcon'
import {categoryLabel} from '../components/catalogue/CategoryTabs'
import {HomeFaq} from '../components/HomeFaq'
import {Button} from '../components/Button'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import DocumentHead from '../components/DocumentHead'
import { api, Course, VirtualClass, formatPrice, formatWhen } from '../lib/api'
type LandingCourse = Course & { archived?: boolean; durationMinutes?: number }
function durationLabel(minutes: number) { return `${Math.floor(minutes / 60) ? `${Math.floor(minutes / 60)}h ` : ''}${minutes % 60 ? `${minutes % 60}m` : ''}`.trim() }

const command = "printf '\\x45\\x43\\x48\\x4f\\n'"
function WorkshopTerminal() {
 const [input,setInput]=useState(command),[ran,setRan]=useState(false),[message,setMessage]=useState('')
 return <section className="paper-terminal" aria-label="Try your first exercise"><div><span>workshop / bytes-to-text</span><span>01</span></div><form onSubmit={e=>{e.preventDefault();if(input.trim()===command){setRan(true);setMessage('ECHO')}else{setRan(false);setMessage('Try the example exactly as shown. This exercise only recognises the displayed command.')}}}><label htmlFor="first-command">Four bytes. One word. Run the example.</label><p className="terminal-example"><code>{command}</code></p><input id="first-command" value={input} onChange={e=>{setInput(e.target.value);setRan(false)}} spellCheck={false} autoComplete="off"/><Button type="submit">Run command →</Button><output role="status">{message}</output>{ran&&<Link href="/courses">You just did your first exercise. Continue →</Link>}<p className="terminal-note">A safe browser exercise. No commands run on your device.</p></form></section>
}
function benefit(c:Course){
 const t=(c.title+' '+c.category).toLowerCase()
 if(/cyber|security/.test(t))return 'Practise protecting systems and investigating problems in a guided learning environment.'
 if(/kids|holiday/.test(t))return 'Explore coding and digital creativity through practical activities.'
 if(/cloud/.test(t))return 'Work through cloud concepts and practise putting services together.'
 if(/software|web|programming/.test(t))return 'Build practical coding skills, one working exercise at a time.'
 if(/marketing|brand/.test(t))return 'Develop practical ways to communicate and present a brand online.'
 return 'Turn the ideas in '+c.title+' into practical skills with guided exercises.'
}
export default function Home(){
 const [courses,setCourses]=useState<LandingCourse[]>([]),[sessions,setSessions]=useState<VirtualClass[]>([]),[loading,setLoading]=useState(true),[error,setError]=useState(''),[attempt,setAttempt]=useState(0)
 useEffect(()=>{let active=true;setLoading(true);setError('');api.homepageCourses().then(list=>{if(active)setCourses((list as LandingCourse[]).filter(c=>!c.archived&&c.published&&c.title.trim()&&c.description.trim()))}).catch(e=>{if(active)setError(e.message)}).finally(()=>{if(active)setLoading(false)});api.classes().then(list=>{if(active)setSessions(list)}).catch(()=>{});return()=>{active=false}},[attempt])
 const next=sessions.filter(s=>s.status==='Live'||(s.status==='Scheduled'&&new Date(s.startsAt).getTime()>Date.now())).sort((a,b)=>(a.status==='Live'?-1:b.status==='Live'?1:0)||new Date(a.startsAt).getTime()-new Date(b.startsAt).getTime())[0]
 const tutors=Array.from(new Map(courses.filter(c=>c.tutor?.name).map(c=>[c.tutor!.id,c.tutor!])).values())
 const featured=courses.slice(0,3)
 return <><DocumentHead title="EchoFreelance — Less watching. More doing."/><main className="paper-home">
 <section className="paper-hero paper-wrap compact-hero" aria-labelledby="paper-title">
 <div className="compact-hero-copy"><h1 id="paper-title"><span>Less watching.</span><span>More <span className="paper-circle">doing.<svg viewBox="0 0 500 180" fill="none" aria-hidden="true" preserveAspectRatio="none"><path d="M471 48C405-9 74-2 22 67c-54 75 112 121 287 97 119-16 199-67 155-114C418 0 199-9 92 23"/></svg></span></span></h1>
 <p className="compact-intro">Practical cybersecurity, software and cloud skills. Learn by doing, with a tutor when you need one.</p>
 <div className="paper-actions"><Link href="/courses" className="paper-primary">View courses <span aria-hidden="true">↗</span></Link><Link href="/admissions" className="paper-course-link">Ask admissions →</Link></div>
 <p className="compact-location">Malindi + online · Live tutors · M-Pesa instalments</p></div>
 <div className="compact-hero-media"><figure className="paper-photo"><Image src="/wallpapers/student-collaboration.webp" width="1536" height="1024" alt="Illustrative coding workspace with two people collaborating" priority sizes="(max-width: 767px) 100vw, 45vw"/><figcaption>Learn it. Try it. Ask a question.</figcaption></figure>
 <details className="compact-exercise"><summary>Try a 30-second coding exercise <span aria-hidden="true">+</span></summary><WorkshopTerminal/></details></div>
 {next&&<Link className="compact-live" href={`/classes/${next.id}`}><span>{next.status==='Live'?'Live now':'Next live class'}</span><strong>{next.title}</strong><time dateTime={next.startsAt}>{formatWhen(next.startsAt)}</time><span>View class →</span></Link>}
 </section>
 <section className="paper-programs" aria-labelledby="program-title"><div className="paper-wrap"><p className="paper-section-number">01 / Find your starting point</p><div className="paper-program-header"><h2 id="program-title">A course. A practical next step.</h2><Link className="paper-link" href="/courses">View all courses →</Link></div>{loading?<div className="paper-loading"  role="status">Checking the course catalogue…</div>:error?<div className="paper-loading" role="alert"><p>We couldn’t load the courses.</p><Button className="paper-text-button" onClick={()=>setAttempt(a=>a+1)}>Try again →</Button></div>:featured.length?<ul className="paper-course-grid">{featured.map(c=><li key={c.id} className={`paper-index-card home-feature-card subject-${subjectTone(c.title+' '+c.category)}`}><div className="home-feature-art"><CourseSubjectIcon subject={c.title+' '+c.category}/><span>Learn by doing</span></div><div className="paper-index-code"><span>{categoryLabel(c.category)}</span><span>{c.level&&c.level!=='Not specified'?c.level:'Guided learning'}</span></div><div className="paper-index-body"><h3><Link href={`/courses/${c.id}`}>{c.title}</Link></h3><p>{benefit(c)}</p><dl><div><dt>{c.lessonCount?'Lessons':'Learning steps'}</dt><dd>{c.lessonCount||c.roadmap?.length||'Coming soon'}{c.durationMinutes?' · '+durationLabel(c.durationMinutes):''}</dd></div><div><dt>Course fee</dt><dd>{c.feesPending?'Fee on request':formatPrice(c.priceCents)}</dd></div></dl></div><div className="paper-index-footer"><span>{c.tutor?.name||'School tutor'}</span><Link href={`/courses/${c.id}`}>View course →</Link></div></li>)}</ul>:<div className="paper-loading"><h3>Explore the full course catalogue.</h3><p>Find a course that fits your goals, or ask the school about the next intake.</p><Link className="paper-course-link" href="/courses">View courses →</Link></div>}</div></section>
 <HomeFaq tutorNames={tutors.map(t=>t.name).filter((name):name is string=>Boolean(name))}/>
 </main></>
}
