import Link from 'next/link'
import { CourseSubjectIcon, subjectTone } from './catalogue/CourseSubjectIcon'
import { useEffect, useState } from 'react'
import { Course, formatPrice } from '../lib/api'
import { categoryLabel } from './catalogue/CategoryTabs'

function durationLabel(minutes?:number){if(!minutes)return '';return `${Math.floor(minutes/60)?`${Math.floor(minutes/60)}h `:''}${minutes%60?`${minutes%60}m`:''}`.trim()}

/** The catalogue marks programmes by leaving the level unset.
    TODO(content): add a real `type` field so programmes do not ride on a placeholder level. */
export function isProgramme(course:Course){return !course.level||course.level==='Not specified'||!!course.programmeDuration}

/** A course fee the school has not confirmed yet; never printed as a number. */
function priceLabel(course:Course){return course.feesPending?'Fee on request':formatPrice(course.priceCents)}

/** `3 stages · 2h 30m` — every piece is dropped when its field is missing.
    TODO(content): there is no `format` field (online / on campus); add one to show it here. */
function metaParts(course:Course){
 const parts:string[]=[]
 const stages=course.roadmap?.length
 if(stages)parts.push(`${stages} stage${stages===1?'':'s'}`)
 else if(course.lessonCount)parts.push(`${course.lessonCount} lesson${course.lessonCount===1?'':'s'}`)
 const duration=course.programmeDuration?.trim()||durationLabel(course.durationMinutes)
 if(duration)parts.push(duration)
 return parts
}

export function CourseCard({course,showTutor=false}:{course:Course;showTutor?:boolean}){
 const [saved,setSaved]=useState(false)
 useEffect(()=>{try{setSaved(JSON.parse(localStorage.getItem('ef_saved_courses')||'[]').includes(course.id))}catch{}},[course.id])
 function save(){try{const ids:string[]=JSON.parse(localStorage.getItem('ef_saved_courses')||'[]');const next=saved?ids.filter(id=>id!==course.id):Array.from(new Set([...ids,course.id]));localStorage.setItem('ef_saved_courses',JSON.stringify(next));setSaved(!saved)}catch{}}

 const programme=isProgramme(course)
 const level=course.level&&course.level!=='Not specified'?course.level:''
 const summary=course.description?.trim()||''
 // Bullets stand in for a summary that is missing or too short to say anything.
 const bullets=summary.length<60?course.roadmap?.slice(0,2)||[]:[]
 const meta=metaParts(course)
 const tutor=course.tutor?.name||course.instructor?.name||''

 return <article className={`course-card subject-${subjectTone(course.title+' '+course.category)}`}>
  <div className="course-card-head">
   <div className="course-card-subject">
    <span className="course-card-icon"><CourseSubjectIcon subject={course.title+' '+course.category}/></span>
    <p className="course-card-category">{categoryLabel(course.category)}</p>
   </div>
   <div className="course-card-badges">
    {level&&<span className="course-badge">{level}</span>}
    {programme&&<span className="course-badge course-badge-programme">Programme</span>}
   </div>
  </div>
  <div className="course-card-body">
   <h2 className="course-card-title"><Link href={`/courses/${course.id}`}>{course.title}</Link></h2>
   {summary&&<p className="course-card-summary">{summary}</p>}
   {bullets.length>0&&<ul className="course-card-learn" aria-label="What you’ll learn">{bullets.map(step=><li key={step}>{step}</li>)}</ul>}
   {meta.length>0&&<p className="course-card-meta">{meta.join(' · ')}</p>}
   {showTutor&&tutor&&<p className="course-card-tutor">{tutor}</p>}
  </div>
  <div className="course-card-foot">
   <p className={`course-price ${course.feesPending?'course-price-pending':''}`}>{priceLabel(course)}</p>
   <div className="course-card-actions">
    <button type="button" className="course-save" aria-label={`Save ${course.title}`} aria-pressed={saved} onClick={e=>{e.stopPropagation();save()}}>
     <svg viewBox="0 0 24 24" fill={saved?'currentColor':'none'} aria-hidden="true"><path d="M6 4h12v17l-6-4-6 4V4Z"/></svg>
    </button>
    <svg className="course-arrow" viewBox="0 0 24 24" aria-hidden="true"><path d="M7 17 17 7M9 7h8v8"/></svg>
   </div>
  </div>
 </article>
}
