type TechPhotoProps = { variant?: 'hero' | 'login' | 'register' }

export function TechPhoto({ variant = 'hero' }: TechPhotoProps) {
  const hero = variant === 'hero'
  return (
    <figure className={`ef-tech-photo relative isolate min-w-0 overflow-hidden rounded-2xl border border-white/10 bg-slate-900 shadow-xl ${hero ? 'ef-tech-photo-hero' : 'ef-tech-photo-auth'}`}>
      <img
        src={variant === 'login' ? '/wallpapers/coding-workspace.jpg' : '/wallpapers/developer-workspace.jpg'}
        alt={variant === 'login' ? 'Code editor displayed on a monitor in a dark developer workspace' : 'Dual-monitor developer workspace with code on screen and cool blue lighting'}
        className="absolute inset-0 h-full w-full object-cover object-[center_40%]"
        fetchPriority={hero ? 'high' : undefined}
        width={variant === 'login' ? 1400 : 1600}
        height={variant === 'login' ? 933 : 2187}
      />
      <div aria-hidden="true" className="absolute inset-0 bg-slate-950/20 mix-blend-multiply" />
      <div aria-hidden="true" className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/10 to-transparent" />
      <div className="absolute left-4 top-4 rounded-full border border-white/20 bg-slate-950/60 px-3 py-2 text-[10px] font-semibold uppercase tracking-widest text-emerald-100 backdrop-blur-md sm:left-6 sm:top-6 sm:text-xs">Code · Security · Cloud</div>
      <figcaption className="absolute inset-x-3 bottom-3 rounded-xl border border-white/20 bg-slate-950/65 p-4 text-white shadow-lg backdrop-blur-xl sm:inset-x-5 sm:bottom-5 sm:p-6">
        <p className="text-[10px] font-semibold uppercase tracking-widest text-emerald-200 sm:text-xs">{hero ? 'Built for curious minds' : 'Your next chapter'}</p>
        <p className="mt-2 max-w-sm font-display text-2xl leading-tight sm:text-3xl">{hero ? 'Real skills. Your own workspace.' : variant === 'login' ? 'Back to building.' : 'Make your next move.'}</p>
        <p className="mt-3 hidden max-w-sm text-sm leading-6 text-slate-200 sm:block">{hero ? 'Learn to build software, explore systems, and think like a security professional.' : 'Practical courses, guided labs, and a community that learns with you.'}</p>
      </figcaption>
    </figure>
  )
}
