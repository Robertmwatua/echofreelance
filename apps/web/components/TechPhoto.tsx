import { useEffect, useState } from 'react'

type TechPhotoProps = { variant?: 'hero' | 'login' | 'register' }
const slides = [
  { src: '/wallpapers/student-collaboration.webp', alt: 'Two students collaborating at a software development workspace', label: 'Learn together', title: 'Big ideas start with a little guidance.', body: 'Build practical skills with courses, assignments and tutor-led classes.' },
  { src: '/wallpapers/security-lab.webp', alt: 'Laptop and networking equipment in a cybersecurity training workspace', label: 'Build real skills', title: 'Your next challenge starts here.', body: 'Explore software, cybersecurity and cloud, one lesson at a time.' },
]

export function TechPhoto({ variant = 'hero' }: TechPhotoProps) {
  const hero = variant === 'hero'
  const [index, setIndex] = useState(0)
  const [playing, setPlaying] = useState(false)
  const [hovered, setHovered] = useState(false)
  useEffect(() => {
    if (!hero || !playing || hovered) return
    const timer = window.setInterval(() => setIndex(i => (i + 1) % slides.length), 6500)
    return () => window.clearInterval(timer)
  }, [hero, playing, hovered])
  const selected = hero ? index : variant === 'login' ? 1 : 0
  const slide = slides[selected]
  return (
    <figure className={`ef-tech-photo relative isolate min-w-0 overflow-hidden ${hero ? 'ef-tech-photo-hero' : 'ef-tech-photo-auth'}`}
      aria-label={hero ? 'Learning inspiration slideshow' : undefined}
      onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)}
      onFocusCapture={() => setHovered(true)} onBlurCapture={e => { if (!e.currentTarget.contains(e.relatedTarget as Node)) setHovered(false) }}>
      {slides.map((image, i) => <img key={image.src} src={image.src} alt={i === selected ? image.alt : ''} aria-hidden={i !== selected}
        className={`ef-slide-image absolute inset-0 h-full w-full object-cover ${i === selected ? 'is-active' : ''}`}
        fetchPriority={hero && i === 0 ? 'high' : undefined} loading={hero ? 'eager' : 'lazy'} width={1536} height={1024} />)}
      <div className="ef-photo-label">{slide.label}</div>
      <figcaption className="ef-photo-caption">
        <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-300 sm:text-xs">Code · Security · Cloud</p>
        <p className="mt-2 max-w-sm font-display text-2xl font-bold leading-tight sm:text-3xl">{hero ? slide.title : variant === 'login' ? 'Back to building.' : 'Make your next move.'}</p>
        <p className="mt-3 max-w-sm text-sm leading-6 text-slate-200">{slide.body}</p>
        {hero && <div className="ef-slide-controls" aria-label="Slideshow controls">
          <div className="flex gap-1">{slides.map((s, i) => <button key={s.src} type="button" className="ef-slide-dot" aria-label={`Show photo ${i + 1}: ${s.label}`} aria-pressed={index === i} onClick={() => { setIndex(i); setPlaying(false) }}><span /></button>)}</div>
          <button type="button" className="ef-slide-play" onClick={() => setPlaying(p => !p)} aria-label={playing ? 'Pause slideshow' : 'Play slideshow'}>{playing ? 'Ⅱ Pause' : '▶ Play'}<span className="sr-only"> slideshow</span></button>
        </div>}
      </figcaption>
    </figure>
  )
}
