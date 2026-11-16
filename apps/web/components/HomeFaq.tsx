import Link from 'next/link'
import {SCHOOL_WHATSAPP_URL} from '../lib/brand'

/** Existing homepage answers, unchanged. Teaching names come from published courses. */
export function HomeFaq({tutorNames}:{tutorNames:string[]}) {
 const questions=[
  {question:'How does learning work?',answer:'Follow the lessons, try the assignments and ask your tutor about the parts you find difficult. Check each course page for its level, learning plan and available live classes.'},
  {question:'Fees and paying in instalments',answer:'Course pages show tuition in KES. Pay by M-Pesa and track confirmed instalments and your balance in your fee statement. The required deposit and any discount appear before payment. Registration and certification charges are displayed separately.',link:true},
  {question:'Who will teach me?',answer:(tutorNames.length?tutorNames.join(', ')+'. Your course page shows the assigned tutor.':'Your course page shows the assigned tutor.')+' Submit assignments to receive tutor feedback.'},
  {question:'Experience, classes and certificates',answer:'Check the course level before joining. The school is based in Malindi with online learning available; confirm your programme’s format with admissions. Certificates require completion of the required lessons and assessments. If you miss a class, contact your tutor about materials and the next session.'}
 ]
 return <section className="paper-wrap compact-guide home-faq" aria-labelledby="guide-title">
  <div className="home-faq-intro">
   <p className="paper-section-number">02 / Good to know</p><h2 id="guide-title">A clear way to start.</h2>
   <p className="ef-muted">Choose a course, practise the lessons, and bring your questions to your tutor.</p>
   <div className="home-faq-actions">
    {SCHOOL_WHATSAPP_URL?<a className="ef-btn" href={SCHOOL_WHATSAPP_URL} target="_blank" rel="noreferrer">Ask on WhatsApp ↗</a>:<Link className="ef-btn" href="/admissions">Talk to the school</Link>}
    <Link className="home-faq-browse" href="/courses">Browse courses →</Link>
   </div>
  </div>
  <div className="paper-faq home-faq-list">
   {questions.map((item,index)=><details key={item.question} open={index===0}><summary>{item.question}<span className="home-faq-plus" aria-hidden="true"/></summary><div className="home-faq-answer"><p>{item.answer}</p>{item.link&&<Link href="/courses">Compare courses and fees →</Link>}</div></details>)}
  </div>
 </section>
}
