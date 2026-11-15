import { useEffect, useRef, useState } from 'react'
export function Dropdown({ label, value, options, onChange }: { label: string; value: string; options: {value:string;label:string}[]; onChange:(v:string)=>void }) {
  const [open,setOpen]=useState(false)
  const root=useRef<HTMLDivElement>(null), trigger=useRef<HTMLButtonElement>(null)
  useEffect(()=>{if(!open)return;function outside(e:PointerEvent){if(!root.current?.contains(e.target as Node))setOpen(false)}document.addEventListener('pointerdown',outside);return()=>document.removeEventListener('pointerdown',outside)},[open])
  return <div className="catalogue-dropdown" ref={root} onKeyDown={e=>{if(e.key==='Escape'){setOpen(false);trigger.current?.focus()}if(open&&(e.key==='ArrowDown'||e.key==='ArrowUp')){e.preventDefault();const buttons=Array.from(root.current?.querySelectorAll<HTMLButtonElement>('[role=option]')||[]);const i=buttons.indexOf(document.activeElement as HTMLButtonElement);buttons[(i+(e.key==='ArrowDown'?1:buttons.length-1)+buttons.length)%buttons.length]?.focus()}}}>
    <button ref={trigger} className="catalogue-filter" aria-haspopup="listbox" aria-expanded={open} onClick={()=>setOpen(!open)}>{label}{value?`: ${options.find(o=>o.value===value)?.label||value}`:''} <span aria-hidden>⌄</span></button>
    {open&&<div className="catalogue-options" role="listbox" aria-label={label}>{options.map(o=><button key={o.value} role="option" aria-selected={o.value===value} onClick={()=>{onChange(o.value);setOpen(false);trigger.current?.focus()}}>{o.label}{o.value===value&&<span aria-hidden>✓</span>}</button>)}</div>}
  </div>
}
