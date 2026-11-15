import {Button,NavigationLink} from './Button'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import { StudioDialog } from './tutor/StudioDialog'
type InstallPrompt = Event & { prompt: () => Promise<void>; userChoice: Promise<{outcome: 'accepted' | 'dismissed'}> }
export function InstallApp() {
  const [prompt, setPrompt] = useState<InstallPrompt | null>(null)
  const [installed, setInstalled] = useState(false)
  const [open, setOpen] = useState(false)
  const [ios, setIos] = useState(false)
  const [message, setMessage] = useState('')
  const [busy, setBusy] = useState(false)
  useEffect(() => {
    const standalone = matchMedia('(display-mode: standalone)')
    const sync = () => setInstalled(standalone.matches || Boolean((navigator as Navigator & {standalone?: boolean}).standalone))
    sync(); setIos(/iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1))
    const before = (event: Event) => { event.preventDefault(); setPrompt(event as InstallPrompt) }
    const done = () => { setInstalled(true); setPrompt(null); setMessage('The app is installed. Open it from your device’s home screen or app launcher.') }
    const show = () => setOpen(true)
    window.addEventListener('beforeinstallprompt', before); window.addEventListener('appinstalled', done); window.addEventListener('ef:install', show); standalone.addEventListener('change', sync)
    if (process.env.NODE_ENV === 'production' && 'serviceWorker' in navigator && window.isSecureContext) navigator.serviceWorker.register('/sw.js', {updateViaCache:'none'}).catch(() => { /* The website stays usable if registration is unavailable. */ })
    return () => { window.removeEventListener('beforeinstallprompt', before); window.removeEventListener('appinstalled', done); window.removeEventListener('ef:install', show); standalone.removeEventListener('change', sync) }
  }, [])
  async function install() {
    if (!prompt) { setOpen(true); return }
    setBusy(true); setMessage('')
    try { await prompt.prompt(); const result = await prompt.userChoice; setPrompt(null); if (result.outcome === 'dismissed') setMessage('No problem. You can install later from your browser menu.'); else setMessage('Installation accepted. Your browser will finish adding the app.') }
    catch { setMessage('Use your browser’s Install app or Add to Home Screen option.'); setPrompt(null) }
    finally { setBusy(false) }
  }
  return <><section className="ef-install-strip" aria-label="Get the school app"><img src="/icons/app-192.png" width="52" height="52" alt=""/><div><p className="ef-section-label">Your school / one tap away</p><h2>{installed?'Your school, on your home screen.':'Keep the school in your pocket.'}</h2><p className="ef-muted text-sm">Open your courses and classes from an app icon. No app store download needed.</p></div><Button className="ef-btn" disabled={busy} onClick={() => { setOpen(true); if (prompt) void install() }}>{installed?'App installed':busy?'Opening…':'Install app ↗'}</Button><NavigationLink href="/install" className="ef-btn-ghost">How it works</NavigationLink></section>{open&&<StudioDialog title={installed?'Your app is installed':'Install EchoFreelance'} close={()=>setOpen(false)} busy={busy}><p className="ef-muted mt-5">{installed?'Launch the school from your home screen or app launcher.':ios?'On iPhone or iPad, open this site in Safari. Tap Share, then Add to Home Screen, and confirm Add.':prompt?'Add a dedicated school app to your device. It opens the same live site in its own window.':'Open your browser menu and look for Install app or Add to Home Screen. In-app browsers may require opening the site in Chrome, Edge or Safari first.'}</p>{!installed&&prompt&&<Button className="ef-btn mt-6" disabled={busy} onClick={()=>void install()}>{busy?'Opening…':'Install on this device →'}</Button>}<p className="ef-meta mt-5">Internet is required for classes, lessons and your account. Offline, you’ll see a reconnect screen.</p>{message&&<p className="ef-toast" role="status">{message}</p>}</StudioDialog>}</>
}
