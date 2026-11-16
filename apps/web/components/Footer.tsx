import Link from 'next/link'
import {SITE_NAME,SCHOOL_CONTACT_EMAIL,SCHOOL_LOCATION,SCHOOL_WHATSAPP_URL,SCHOOL_MAP_URL,SCHOOL_MAP_EMBED_URL} from '../lib/brand'

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
    <div className="school-footer-links"><div className="school-footer-learn"><h2>Learn</h2><ul>
     {[['/courses','Courses'],['/classes','Live classes'],['/challenges','Challenges'],['/discussions','Community'],['/careers','Careers'],['/admissions','Admissions']].map(([href,label])=><li key={href}><Link href={href}>{label}</Link></li>)}
    </ul></div>
    <div className="school-footer-account"><h2>Your account</h2><ul>
     {(signedIn?[['/notes','Notes'],['/certificates/mine','Certificates'],['/fees','Fees & receipts'],['/settings','Settings']]:[['/login','Log in'],['/register','Join the school']]).map(([href,label])=><li key={href}><Link href={href}>{label}</Link></li>)}
    </ul></div></div>
    {hasContact&&<div className="school-footer-contact"><h2>Visit & contact</h2>
     <div className="school-footer-contact-details">
      <p className="school-footer-location"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20 10c0 6-8 12-8 12S4 16 4 10a8 8 0 1 1 16 0Z"/><circle cx="12" cy="10" r="2.5"/></svg><span>{SCHOOL_LOCATION}</span></p>
      {SCHOOL_CONTACT_EMAIL&&<a className="school-footer-email" href={`mailto:${SCHOOL_CONTACT_EMAIL}`}><svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="5" width="18" height="14" rx="1"/><path d="m3 6 9 7 9-7"/></svg><span>{SCHOOL_CONTACT_EMAIL}</span></a>}
      {SCHOOL_WHATSAPP_URL&&<a href={SCHOOL_WHATSAPP_URL} target="_blank" rel="noreferrer">WhatsApp ↗</a>}
     </div>
     <div className="school-footer-map"><iframe src={SCHOOL_MAP_EMBED_URL} title="School location in Malindi on Google Maps" loading="lazy" referrerPolicy="no-referrer-when-downgrade" allowFullScreen/><a href={SCHOOL_MAP_URL} target="_blank" rel="noreferrer"><span>Open in Google Maps</span><span aria-hidden="true">↗</span></a></div>
    </div>}

   </nav>
   <div className="school-footer-bottom"><p>© {new Date().getFullYear()} {SITE_NAME}</p><Link href="/privacy">Privacy policy</Link>{/* No Terms link: the project has no terms route. */}</div>
  </div>
 </footer>
}
