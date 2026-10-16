import { useEffect, useRef, useState } from 'react'

type MeetingEvent = { isFatal?: boolean; type?: string }
type Meeting = {
  addListener: (event: string, listener: (event: MeetingEvent) => void) => void
  dispose: () => void
}
type MeetingConstructor = new (domain: string, options: Record<string, unknown>) => Meeting

declare global { interface Window { JitsiMeetExternalAPI?: MeetingConstructor } }
let sdkPromise: Promise<MeetingConstructor> | undefined

function loadSdk(appId: string): Promise<MeetingConstructor> {
  if (window.JitsiMeetExternalAPI) return Promise.resolve(window.JitsiMeetExternalAPI)
  if (sdkPromise) return sdkPromise
  sdkPromise = new Promise((resolve, reject) => {
    const script = document.createElement('script')
    const timer = window.setTimeout(() => fail(), 15000)
    const fail = () => {
      window.clearTimeout(timer)
      script.remove()
      sdkPromise = undefined
      reject(new Error('The video service couldn’t load. Check your connection or browser blockers, then retry.'))
    }
    script.src = `https://8x8.vc/${encodeURIComponent(appId)}/external_api.js`
    script.async = true
    script.onerror = fail
    script.onload = () => {
      window.clearTimeout(timer)
      if (window.JitsiMeetExternalAPI) resolve(window.JitsiMeetExternalAPI)
      else fail()
    }
    document.head.appendChild(script)
  })
  return sdkPromise
}

export function JaasRoom({ roomUrl, onClose }: { roomUrl: string; onClose: () => void }) {
  const parent = useRef<HTMLDivElement>(null)
  const close = useRef(onClose)
  close.current = onClose
  const [state, setState] = useState('Loading video service…')
  const [error, setError] = useState('')
  const [warning, setWarning] = useState('')
  const [attempt, setAttempt] = useState(0)

  useEffect(() => {
    let active = true
    let meeting: Meeting | undefined
    setError('')
    setWarning('')
    setState('Loading video service…')
    let readyTimer: ReturnType<typeof setTimeout> | undefined
    async function connect() {
      if (!window.isSecureContext || !navigator.mediaDevices?.getUserMedia) {
        throw new Error('Camera and microphone require HTTPS and a supported browser. Open this page in your browser over HTTPS.')
      }
      const url = new URL(roomUrl)
      const [appId, room, ...extra] = url.pathname.split('/').filter(Boolean)
      const token = url.searchParams.get('jwt')
      if (url.origin !== 'https://8x8.vc' || !appId || !room || extra.length || !token) throw new Error('The classroom link is invalid. Return to the class and join again.')
      const Constructor = await loadSdk(appId)
      if (!active || !parent.current) return
      setState('Opening the device preview. Allow camera and microphone when prompted.')
      meeting = new Constructor('8x8.vc', {
        roomName: `${appId}/${room}`, jwt: token, parentNode: parent.current,
        width: '100%', height: '100%',
        configOverwrite: { prejoinConfig: { enabled: true }, startWithAudioMuted: true },
        onload: () => { if (active) { clearTimeout(readyTimer); setState('Device preview ready. Choose your devices and join the class.') } },
      })
      readyTimer = setTimeout(() => { if (active) setWarning('The classroom is taking longer than usual. Try the new-tab option or retry the video service.') }, 30000)
      meeting.addListener('videoConferenceJoined', () => { if (active) { clearTimeout(readyTimer); setState('Connected to the live classroom'); setWarning('') } })
      meeting.addListener('readyToClose', () => { if (active) close.current() })
      meeting.addListener('cameraError', () => { if (active) setWarning('Camera unavailable. Allow camera access in your browser and close other apps using it. You can still join without video.') })
      meeting.addListener('micError', () => { if (active) setWarning('Microphone unavailable. Check browser permissions and close other apps using your microphone.') })
      meeting.addListener('errorOccurred', event => { if (active && event.isFatal) setError('The meeting connection failed. Retry, or open the classroom in a new tab. If it persists, ask the tutor to check JaaS configuration.') })
    }
    connect().catch((e: Error) => { if (active) setError(e.message) })
    return () => { active = false; clearTimeout(readyTimer); meeting?.dispose() }
  }, [roomUrl, attempt])

  return <section aria-label="Live video classroom">
    <p role="status" className="ef-meta mb-3">{error ? 'Classroom disconnected' : state}</p>
    {(warning || error) && <div className="ef-panel mb-4" role="alert"><p>{error || warning}</p><button type="button" className="ef-btn-ghost mt-4" onClick={() => setAttempt(a => a + 1)}>Retry video service</button></div>}
    <div ref={parent} className="h-[70vh] min-h-[360px] overflow-hidden rounded-xl border border-line bg-slate-950 sm:h-[76vh]" />
  </section>
}
