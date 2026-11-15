/** Small, code-native subject illustrations; no remote assets or icon font. */
export function subjectTone(subject:string){
 const value=subject.toLowerCase()
 if(/security|network/.test(value))return 'security'
 if(/cloud|software|code|programming|web/.test(value))return 'code'
 if(/design|animation|3d|creative/.test(value))return 'creative'
 return 'foundation'
}
export function CourseSubjectIcon({subject}:{subject:string}){
 const tone=subjectTone(subject)
 return <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{tone==='security'?<><path d="m12 3 8 3v6c0 5-8 9-8 9s-8-4-8-9V6l8-3Z"/><path d="m8 12 3 3 5-6"/></>:tone==='code'?<><rect x="2" y="4" width="20" height="16"/><path d="m9 9-3 3 3 3m6-6 3 3-3 3m-2-7-2 10"/></>:tone==='creative'?<><path d="m12 2 9 5v10l-9 5-9-5V7l9-5Zm0 10L3 7m9 5 9-5m-9 5v10"/></>:<><path d="m2 7 10-4 10 4-10 4L2 7Zm4 3v7c4 3 8 3 12 0v-7m4-3v9"/></>}</svg>
}
