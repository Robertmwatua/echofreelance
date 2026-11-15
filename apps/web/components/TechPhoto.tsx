import Image from 'next/image'
type TechPhotoProps = { variant?: 'hero' | 'login' | 'register' }
/** The media is illustrative; it never claims to document the school or its students. */
export function TechPhoto({variant='hero'}:TechPhotoProps) {
 const security=variant==='login'
 return <figure className="ef-auth-photo"><Image decoding="async" src={security?'/wallpapers/security-lab.webp':'/wallpapers/student-collaboration.webp'} alt={security?'Illustrative cybersecurity workspace with a laptop and network equipment':'Illustrative scene of people working together at a coding desk'} width={1536} height={1024} loading={variant==='hero'?'eager':'lazy'} sizes="(max-width: 767px) 100vw, 45vw"/><figcaption><span className="ef-section-label">{security?'Workspace / back to building':'School notebook / learn by doing'}</span><p className="mt-2">{security?'Your courses, notes and next question are waiting.':'Bring a question. Leave with something you can try.'}</p></figcaption></figure>
}
