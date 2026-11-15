import {Button} from './Button'
import { useEffect, useRef, useState } from 'react'
import { StudioDialog } from './tutor/StudioDialog'

/** One visual confirmation surface; callers retain their existing mutations. */
export function useConfirmation() {
  const [message, setMessage] = useState('')
  const pending = useRef<((answer: boolean) => void) | null>(null)
  useEffect(() => () => { pending.current?.(false) }, [])
  function settle(answer: boolean) { pending.current?.(answer); pending.current = null; setMessage('') }
  function confirm(message: string) {
    pending.current?.(false)
    setMessage(message)
    return new Promise<boolean>(resolve => { pending.current = resolve })
  }
  const confirmation = message ? <StudioDialog title="Before you go ahead" close={() => settle(false)}><p className="ef-muted mt-5 leading-7">{message}</p><div className="mt-6 flex flex-wrap gap-5"><Button type="button" autoFocus className="ef-btn-ghost" onClick={() => settle(false)}>Keep it as it is</Button><Button type="button" className="ef-btn" onClick={() => settle(true)}>Confirm action</Button></div></StudioDialog> : null
  return { confirm, confirmation }
}
