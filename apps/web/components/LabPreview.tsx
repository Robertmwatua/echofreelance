import {Button} from './Button'
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

export function LabPreview({compact=false}:{compact?:boolean}) {
 const [language,setLanguage]=useState<Language>('Python')
 const [ran,setRan]=useState(false)
 const example=examples[language]
 return <section className="ef-panel min-w-0" aria-label="Interactive coding preview"><p className="ef-section-label">Notebook / code exercise</p><div className="my-4 flex gap-3" role="group" aria-label="Code language">{(Object.keys(examples) as Language[]).map(lang=><Button key={lang} className="ef-filter" aria-pressed={lang===language} onClick={()=>{setLanguage(lang);setRan(false)}}>{lang}</Button>)}</div><p className="ef-meta">{example.file}</p><pre className={`my-5 overflow-x-auto font-mono text-xs leading-7 ${compact?'':'min-h-[275px]'}`} tabIndex={0}><code>{example.lines.join('\n')}</code></pre><div className="border-t border-line pt-5"><Button className="ef-btn" onClick={()=>setRan(true)}>{ran?'Run again':'Run preview'} ↗</Button><div className="ef-meta mt-4" role="status" aria-live="polite">{ran?example.output.map(line=><p key={line}>{line}</p>):<p>Choose a language, then run the exercise.<br/>Simulated output; no commands are executed.</p>}</div></div></section>
}
export function AuthLearningPanel(){return <aside className="ef-panel"><p className="ef-section-label">School notebook / learn by doing</p><h2 className="mt-4 text-4xl">Build. Test. Understand.</h2><p className="ef-muted my-5">Bring questions to guided live classes. Work through lessons at your own pace.</p><LabPreview compact/></aside>}
