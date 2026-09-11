/** Floating laptop mock for desktop hero — CSS-only. */
export function FloatingLaptop() {
  return (
    <div className="ef-float-laptop relative mx-auto hidden w-full max-w-[420px] select-none lg:block">
      <div className="ef-laptop relative">
        <div className="overflow-hidden rounded-t-xl border border-white/15 bg-slate-950 shadow-[0_30px_60px_-20px_rgba(0,0,0,0.7)]">
          <div className="flex items-center gap-1.5 border-b border-white/10 bg-slate-900 px-3 py-2">
            <span className="h-2 w-2 rounded-full bg-red-400/80" />
            <span className="h-2 w-2 rounded-full bg-amber-400/80" />
            <span className="h-2 w-2 rounded-full bg-emerald-400/80" />
            <span className="ml-3 truncate text-[10px] text-white/40">
              echofreelance tech school · live
            </span>
          </div>
          <div
            className="relative aspect-[16/10] p-4"
            style={{
              backgroundImage:
                'linear-gradient(160deg, rgba(15,23,42,0.92), rgba(15,23,42,0.7)), url(/wallpapers/code.jpg)',
              backgroundSize: 'cover',
              backgroundPosition: 'center',
            }}
          >
            <p className="font-display text-lg text-teal-300">EchoFreelance Tech School</p>
            <p className="mt-1 text-[11px] text-white/55">Tutor desk · Instant meeting</p>
            <div className="mt-4 grid grid-cols-2 gap-2">
              <div className="rounded-lg bg-white/10 p-2.5 ring-1 ring-white/10 backdrop-blur">
                <p className="text-[10px] font-semibold text-white/90">Web Security</p>
                <div className="mt-2 h-1 overflow-hidden rounded bg-white/10">
                  <div className="h-full w-3/4 rounded bg-teal-400" />
                </div>
              </div>
              <div className="rounded-lg bg-white/10 p-2.5 ring-1 ring-white/10 backdrop-blur">
                <p className="text-[10px] font-semibold text-white/90">Live now</p>
                <p className="mt-1 text-[9px] text-sky-300">12 in room</p>
              </div>
            </div>
            <div className="absolute bottom-4 left-4 right-4 flex gap-2">
              <div className="flex-1 rounded-md bg-teal-400/90 py-1.5 text-center text-[10px] font-bold text-slate-950">
                Start class
              </div>
              <div className="flex-1 rounded-md bg-white/10 py-1.5 text-center text-[10px] font-semibold text-white/80 ring-1 ring-white/15">
                Schedule
              </div>
            </div>
          </div>
        </div>
        <div className="mx-auto h-2 w-[108%] -translate-x-[4%] rounded-b-md bg-gradient-to-b from-slate-700 to-slate-800" />
        <div className="mx-auto h-1 w-[40%] rounded-b bg-slate-600" />
      </div>
    </div>
  )
}
