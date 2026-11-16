export type Theme = 'dark' | 'light'
const KEY = 'theme'
let memoryChoice:Theme|null=null
const isTheme = (value:unknown):value is Theme => value==='dark'||value==='light'

function savedTheme():Theme|null {
 if(memoryChoice)return memoryChoice
 try {
  const choice=localStorage.getItem(KEY)
  if(isTheme(choice))return choice
  // Preserve an existing user's explicit preference when upgrading.
  const legacy=localStorage.getItem('ef_theme')
  if(isTheme(legacy)){localStorage.setItem(KEY,legacy);localStorage.removeItem('ef_theme');return legacy}
 } catch { /* Storage can be blocked; system theme still works. */ }
 return null
}
export function getStoredTheme():Theme {
 if(typeof window==='undefined')return 'light'
 return savedTheme()||(window.matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light')
}
export function applyTheme(theme:Theme,persist=false) {
 if(typeof document==='undefined')return
 const root=document.documentElement
 root.dataset.theme=theme
 // Compatibility for the existing Tailwind dark variant; tokens use data-theme.
 root.classList.toggle('dark',theme==='dark')
 root.classList.remove('light')
 root.style.colorScheme=theme
 if(persist){memoryChoice=theme;try{localStorage.setItem(KEY,theme)}catch{}}
 let meta=document.querySelector<HTMLMetaElement>('meta[name="theme-color"]')
 if(!meta){meta=document.createElement('meta');meta.name='theme-color';document.head.appendChild(meta)}
 meta.content=getComputedStyle(root).backgroundColor
 root.dataset.themeReady='true'
}
export function toggleTheme():Theme {
 const next:Theme=document.documentElement.dataset.theme==='dark'?'light':'dark'
 applyTheme(next,true)
 window.dispatchEvent(new Event('ef:theme-changed'))
 return next
}
export function watchTheme(onChange:(theme:Theme)=>void) {
 const system=window.matchMedia('(prefers-color-scheme: dark)')
 let listening=false
 const onSystem=()=>{if(!savedTheme()){const theme=system.matches?'dark':'light';applyTheme(theme);onChange(theme)}}
 const sync=()=>{
  const automatic=!savedTheme()
  if(automatic&&!listening){system.addEventListener('change',onSystem);listening=true}
  if(!automatic&&listening){system.removeEventListener('change',onSystem);listening=false}
  const theme=getStoredTheme();applyTheme(theme);onChange(theme)
 }
 const onStorage=(event:StorageEvent)=>{if(event.key===KEY||event.key===null){memoryChoice=null;sync()}}
 window.addEventListener('ef:theme-changed',sync)
 window.addEventListener('storage',onStorage)
 sync()
 return()=>{if(listening)system.removeEventListener('change',onSystem);window.removeEventListener('ef:theme-changed',sync);window.removeEventListener('storage',onStorage)}
}
/** Runs in head before first paint, with no separate hardcoded palette. */
export const THEME_BOOTSTRAP=`(function(){var r=document.documentElement,t;try{t=localStorage.getItem('theme');if(t!=='dark'&&t!=='light'){var old=localStorage.getItem('ef_theme');if(old==='dark'||old==='light'){t=old;localStorage.setItem('theme',old);localStorage.removeItem('ef_theme')}}}catch(e){}if(t!=='dark'&&t!=='light')t=window.matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light';r.dataset.theme=t;r.classList.toggle('dark',t==='dark');r.classList.remove('light');r.style.colorScheme=t;function meta(){var color=getComputedStyle(r).backgroundColor;if(!getComputedStyle(r).getPropertyValue('--bg').trim())return;var m=document.querySelector('meta[name="theme-color"]');if(!m){m=document.createElement('meta');m.name='theme-color';document.head.appendChild(m)}m.content=color}meta();document.addEventListener('DOMContentLoaded',meta,{once:true})})();`
