import { ReactNode, useEffect, useRef } from 'react'

export function StudioDialog({ title, children, close, drawer = false, busy = false }: { title: string; children: ReactNode; close: () => void; drawer?: boolean; busy?: boolean }) {
  const ref = useRef<HTMLDialogElement>(null)
  const closeRef = useRef(close)
  closeRef.current = close
  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null
    const dialog = ref.current!
    dialog.showModal()
    dialog.querySelector<HTMLElement>('[autofocus], input, textarea')?.focus()
    const overflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => { dialog.close(); document.body.style.overflow = overflow; previous?.focus() }
  }, [])
  return <dialog ref={ref} className={`studio-dialog ${drawer ? 'studio-drawer' : ''}`} aria-labelledby="studio-dialog-title" onCancel={e => { e.preventDefault(); if (!busy) closeRef.current() }} onClick={e => { if (e.target === e.currentTarget && !busy) close() }}>
    <div className="studio-dialog-body">
      <header className="flex items-center justify-between gap-4"><h2 id="studio-dialog-title" className="text-xl font-semibold">{title}</h2><button type="button" className="studio-icon" aria-label="Close dialog" disabled={busy} onClick={close}>×</button></header>
      {children}
    </div>
  </dialog>
}
