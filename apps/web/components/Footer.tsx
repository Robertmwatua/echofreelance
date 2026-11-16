import Link from 'next/link'
import {SITE_NAME,SCHOOL_CONTACT_EMAIL,SCHOOL_LOCATION,SCHOOL_WHATSAPP_URL,SCHOOL_MAP_URL} from '../lib/brand'

/** Shared footer. Contact details come only from existing public content/config. */
export function Footer({signedIn}:{signedIn:boolean}) {
 const hasContact=Boolean(SCHOOL_CONTACT_EMAIL||SCHOOL_LOCATION||SCHOOL_WHATSAPP_URL)
 return <footer className="ef-footer school-footer">
  <div className="ef-footer-inner">
   <nav aria-label="Footer" className={`school-footer-grid ${hasContact?'':'school-footer-no-contact'}`}>
    <div className="school-footer-brand">
     <Link href="/" className="ef-wordmark">EchoFreelance.<small>Tech School / Malindi, Kenya</small></Link>
     <p>Practical courses and live classes in cybersecurity, software and cloud — taught by tutors you can actually talk to.</p>
    </div>
    <div className="school-footer-learn"><h2>Learn</h2><ul>
     {[['/courses','Courses'],['/classes','Live classes'],['/challenges','Challenges'],['/discussions','Community'],['/careers','Careers'],['/admissions','Admissions']].map(([href,label])=><li key={href}><Link href={href}>{label}</Link></li>)}
    </ul></div>
    <div className="school-footer-account"><h2>Your account</h2><ul>
     {(signedIn?[['/notes','Notes'],['/certificates/mine','Certificates'],['/fees','Fees & receipts'],['/settings','Settings']]:[['/login','Log in'],['/register','Join the school']]).map(([href,label])=><li key={href}><Link href={href}>{label}</Link></li>)}
    </ul></div>
    {hasContact&&<div className="school-footer-contact"><h2>Contact</h2><ul>
     {SCHOOL_WHATSAPP_URL&&<li><a href={SCHOOL_WHATSAPP_URL} target="_blank" rel="noreferrer">WhatsApp ↗</a></li>}
     {SCHOOL_CONTACT_EMAIL&&<li><a href={`mailto:${SCHOOL_CONTACT_EMAIL}`}>{SCHOOL_CONTACT_EMAIL}</a></li>}
     <li><a href={SCHOOL_MAP_URL} target="_blank" rel="noreferrer">View on Google Maps ↗</a></li>
     {SCHOOL_LOCATION&&<li className="school-footer-location">{SCHOOL_LOCATION}</li>}
    </ul></div>}
   </nav>
   <div className="school-footer-bottom"><p>© {new Date().getFullYear()} {SITE_NAME}</p><Link href="/privacy">Privacy policy</Link>{/* No Terms link: the project has no terms route. */}</div>
  </div>
 </footer>
}
