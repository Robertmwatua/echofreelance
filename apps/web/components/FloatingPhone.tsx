/** Floating device mock for the landing hero — CSS-only, no assets required. */
export function FloatingPhone() {
  return (
    <div className="ef-float relative mx-auto w-[min(100%,220px)] select-none sm:w-[240px] lg:w-[280px]">
      <div className="ef-phone relative aspect-[9/19] overflow-hidden rounded-[2.4rem] border border-white/20 bg-slate-950 shadow-[0_40px_80px_-20px_rgba(0,0,0,0.65)]">
        <div className="absolute left-1/2 top-2.5 z-20 h-6 w-24 -translate-x-1/2 rounded-full bg-black" />
        <div className="absolute inset-[3px] overflow-hidden rounded-[2.15rem] bg-gradient-to-b from-slate-900 to-slate-950">
          <div
            className="absolute inset-0 opacity-40"
            style={{
              backgroundImage:
                'radial-gradient(circle at 20% 20%, rgba(45,212,191,0.35), transparent 45%), radial-gradient(circle at 80% 0%, rgba(125,211,252,0.25), transparent 40%)',
            }}
          />
          <div className="relative flex h-full flex-col px-4 pb-5 pt-12 text-sand">
            <p className="font-display text-lg leading-none tracking-tight text-teal-300">
              EchoFreelance
            </p>
            <p className="mt-1 text-[10px] uppercase tracking-[0.18em] text-white/45">
              Live campus
            </p>

            <div className="mt-5 space-y-2.5">
              <div className="ef-phone-row rounded-xl bg-white/5 p-3 ring-1 ring-white/10 backdrop-blur">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[11px] font-semibold text-white/90">Live now</span>
                  <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-teal-400" />
                </div>
                <p className="mt-1 text-[10px] text-white/55">Web Sec lab · Room open</p>
              </div>
              <div className="ef-phone-row rounded-xl bg-white/5 p-3 ring-1 ring-white/10">
                <p className="text-[11px] font-medium text-white/85">Cloud architectures</p>
                <div className="mt-2 h-1 overflow-hidden rounded bg-white/10">
                  <div className="h-full w-[72%] rounded bg-teal-400/90" />
                </div>
                <p className="mt-1.5 text-[9px] text-white/40">72% complete</p>
              </div>
              <div className="ef-phone-row rounded-xl bg-white/5 p-3 ring-1 ring-white/10">
                <p className="text-[11px] font-medium text-white/85">CTF · Pwn 200</p>
                <p className="mt-1 text-[10px] text-sky-300/80">Flag submitted · +200 pts</p>
              </div>
            </div>

            <div className="mt-auto flex gap-2 pt-4">
              <div className="flex-1 rounded-lg bg-teal-400/90 py-2 text-center text-[10px] font-bold text-slate-950">
                Join class
              </div>
              <div className="flex-1 rounded-lg bg-white/10 py-2 text-center text-[10px] font-semibold text-white/80 ring-1 ring-white/15">
                Catalog
              </div>
            </div>
          </div>
        </div>
      </div>
      <div
        className="pointer-events-none absolute -inset-8 -z-10 rounded-full opacity-60 blur-2xl"
        style={{
          background:
            'radial-gradient(circle, rgba(45,212,191,0.22) 0%, transparent 70%)',
        }}
        aria-hidden
      />
    </div>
  )
}
