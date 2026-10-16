import { useState } from 'react'

const examples = {
  Python: {
    file: 'security/check_headers.py',
    lines: [
      '# Inspect a local lab response',
      'response = {',
      '    "Strict-Transport-Security": "max-age=31536000",',
      '    "X-Content-Type-Options": "nosniff",',
      '}',
      '',
      'for header in response:',
      '    print(f"[PASS] {header}")',
    ],
    output: ['[PASS] Strict-Transport-Security', '[PASS] X-Content-Type-Options', '2 response headers checked.'],
  },
  Bash: {
    file: 'workspace/verify.sh',
    lines: ['# Verify a local development environment', 'printf "Checking workspace…\\n"', 'python3 --version', 'git status --short', '', '# Ready for the next lesson', 'printf "Workspace ready.\\n"'],
    output: ['Checking workspace…', 'Python 3.12.0', 'Workspace ready.'],
  },
} as const

type Language = keyof typeof examples

function Highlight({ line }: { line: string }) {
  if (line.trim().startsWith('#')) return <span className="text-slate-400">{line || ' '}</span>
  return <>{line.split(/("[^"]*"|'[^']*'|\b(?:for|in|print|printf|python3|git)\b)/g).map((part, i) => <span key={i} className={/^["']/.test(part) ? 'text-emerald-200' : /^(for|in|print|printf|python3|git)$/.test(part) ? 'text-sky-300' : 'text-slate-200'}>{part}</span>)}</>
}

export function LabPreview({ compact = false }: { compact?: boolean }) {
  const [language, setLanguage] = useState<Language>('Python')
  const [ran, setRan] = useState(false)
  const example = examples[language]
  return <section aria-label="Interactive coding preview" className="ef-lab-preview min-w-0 overflow-hidden rounded-xl border border-slate-700 bg-slate-900 text-slate-100 shadow-xl">
    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-700 bg-slate-950/60 px-4 py-3">
      <div className="flex items-center gap-3"><span className="flex gap-1.5" aria-hidden="true"><i className="h-2 w-2 rounded-full bg-slate-500" /><i className="h-2 w-2 rounded-full bg-slate-500" /><i className="h-2 w-2 rounded-full bg-emerald-400" /></span><span className="font-mono text-xs text-slate-300">echo / lab-workspace</span></div><span className="text-[10px] uppercase tracking-widest text-slate-400">Interactive preview</span>
    </div>
    <div className="flex gap-1 border-b border-slate-700 px-4 py-2" role="group" aria-label="Code language">{(Object.keys(examples) as Language[]).map(lang => <button key={lang} type="button" aria-pressed={lang === language} onClick={() => { setLanguage(lang); setRan(false) }} className={`min-h-[44px] rounded-md px-4 text-xs font-semibold ${lang === language ? 'bg-slate-700 text-white' : 'text-slate-300 hover:bg-slate-800'}`}>{lang}</button>)}</div>
    <p className="px-5 pt-4 font-mono text-xs text-slate-400">{example.file}</p>
    <pre className={`overflow-x-auto px-5 py-5 font-mono text-xs leading-7 sm:text-sm ${compact ? '' : 'min-h-[275px]'}`} tabIndex={0} aria-label={`${language} sample code`}><code>{example.lines.map((line, i) => <span key={i} className="block"><span aria-hidden="true" className="mr-5 inline-block w-4 select-none text-right text-slate-500">{i + 1}</span><Highlight line={line} /></span>)}</code></pre>
    <div className="border-t border-slate-700 bg-slate-950/60 p-5"><div className="flex flex-wrap items-center justify-between gap-3"><p className="font-mono text-xs text-slate-400">terminal · sample output</p><button type="button" onClick={() => setRan(true)} className="min-h-[44px] rounded-lg border border-emerald-300/30 bg-emerald-300/10 px-4 text-xs font-semibold text-emerald-200 hover:bg-emerald-300/20">{ran ? 'Run again' : 'Run preview'} <span aria-hidden="true">↗</span></button></div><div className="mt-4 min-h-[72px] font-mono text-xs leading-6 text-emerald-200" role="status" aria-live="polite">{ran ? example.output.map(line => <p key={line}>{line}</p>) : <p className="text-slate-400">Choose a language, then run the preview.<br />Simulated output · no commands are executed.</p>}</div></div>
  </section>
}

export function AuthLearningPanel() {
  return <aside className="hidden min-w-0 flex-col justify-center gap-6 rounded-2xl border border-slate-800 bg-slate-950 p-6 text-slate-100 lg:flex">
    <div><p className="text-xs font-semibold uppercase tracking-widest text-emerald-200">Your next skill starts here</p><h2 className="mt-3 font-display text-3xl">Build. Test. Understand.</h2><p className="mt-3 text-sm leading-6 text-slate-300">A workspace for curious developers and future security professionals.</p></div>
    <LabPreview compact />
    <div className="grid grid-cols-2 gap-3"><div className="rounded-xl border border-slate-800 bg-slate-900 p-4"><span className="text-xl text-emerald-200" aria-hidden="true">✓</span><h3 className="mt-2 text-sm font-semibold">Earn certificates</h3><p className="mt-2 text-xs leading-5 text-slate-300">Turn completed courses into verifiable milestones.</p></div><div className="rounded-xl border border-slate-800 bg-slate-900 p-4"><span className="text-xl text-sky-300" aria-hidden="true">↗</span><h3 className="mt-2 text-sm font-semibold">Learn with tutors</h3><p className="mt-2 text-xs leading-5 text-slate-300">Bring questions to guided live classes.</p></div></div>
  </aside>
}
