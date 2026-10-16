type TechPhotoProps = { variant?: 'hero' | 'login' | 'register' }

export function TechPhoto({ variant = 'hero' }: TechPhotoProps) {
  const hero = variant === 'hero'
  return <figure className={`relative isolate overflow-hidden rounded-2xl border border-slate-800 bg-slate-900 ${hero ? 'h-[420px] sm:h-[520px]' : 'hidden min-h-[620px] lg:block'}`}>
    <img
      src={variant === 'login' ? '/wallpapers/coding-workspace.jpg' : '/wallpapers/developer-workspace.jpg'}
      alt={variant === 'login' ? 'Code editor displayed on a monitor in a dark developer workspace' : 'Dual-monitor developer workspace with code on screen and cool blue lighting'}
      className="absolute inset-0 h-full w-full object-cover"
      fetchPriority={hero ? 'high' : undefined}
      width={variant === 'login' ? 1400 : 1600} height={variant === 'login' ? 933 : 2187}
    />
    <div aria-hidden="true" className="absolute inset-0 bg-slate-950/25 mix-blend-multiply" />
    <div aria-hidden="true" className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/10 to-transparent" />
    <div className="absolute left-6 top-6 rounded-lg border border-white/20 bg-slate-950/80 px-4 py-3 text-xs font-semibold uppercase tracking-widest text-emerald-200 backdrop-blur-md">Code · Security · Cloud</div>
    <figcaption className="absolute inset-x-0 bottom-0 p-6 text-white sm:p-8">
      <p className="text-xs font-semibold uppercase tracking-widest text-emerald-200">{hero ? 'Built for curious minds' : 'Your next chapter'}</p>
      <p className="mt-3 max-w-sm font-display text-3xl leading-tight">{hero ? 'Real skills. Your own workspace.' : variant === 'login' ? 'Back to building.' : 'Make your next move.'}</p>
      <p className="mt-3 max-w-sm text-sm leading-6 text-slate-200">{hero ? 'Learn to build software, explore systems, and think like a security professional.' : 'Practical courses, guided labs, and a community that learns with you.'}</p>
      <p className="mt-5 text-[10px] text-slate-300">Photo: <a className="underline underline-offset-4 hover:text-white" href={variant === 'login' ? 'https://unsplash.com/s/photos/coding-quotes' : 'https://unsplash.com/photos/Hb-WIlu_VYM'} target="_blank" rel="noreferrer">{variant === 'login' ? 'Unsplash' : 'Mohammad Rahmani / Unsplash'}</a></p>
    </figcaption>
  </figure>
}
