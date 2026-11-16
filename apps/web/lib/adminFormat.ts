/** Shared admin formatters. The school operates in Nairobi, so staff screens read in
    Nairobi time whatever the device is set to. */
const ZONE = 'Africa/Nairobi'

/** "KES 1,500" — whole shillings, grouped. */
export function money(cents: number) {
  return `KES ${Math.round(cents / 100).toLocaleString('en-KE')}`
}

/** "15 Nov, 4:24 PM" */
export function when(iso: string | Date) {
  const date = typeof iso === 'string' ? new Date(iso) : iso
  if (Number.isNaN(date.getTime())) return ''
  const day = date.toLocaleDateString('en-GB', { timeZone: ZONE, day: 'numeric', month: 'short' })
  const time = date.toLocaleTimeString('en-GB', { timeZone: ZONE, hour: 'numeric', minute: '2-digit', hour12: true })
  return `${day}, ${time.toUpperCase().replace(' ', ' ')}`
}

/** "22h ago", "4m ago", "3d ago" — empty for anything in the future. */
export function age(iso: string | Date, now = Date.now()) {
  const date = typeof iso === 'string' ? new Date(iso) : iso
  const seconds = Math.floor((now - date.getTime()) / 1000)
  if (Number.isNaN(seconds) || seconds < 0) return ''
  if (seconds < 60) return 'just now'
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  return `${Math.floor(hours / 24)}d ago`
}

/** "22h 20m" — how long something has been waiting, for the follow-ups signal. */
export function waited(iso: string | Date, now = Date.now()) {
  const date = typeof iso === 'string' ? new Date(iso) : iso
  const minutes = Math.floor((now - date.getTime()) / 60000)
  if (Number.isNaN(minutes) || minutes < 1) return 'under a minute'
  if (minutes < 60) return `${minutes}m`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ${minutes % 60}m`
  const days = Math.floor(hours / 24)
  return `${days}d ${hours % 24}h`
}

/** The unabbreviated stamp, for a title attribute beside a relative age. */
export function fullWhen(iso: string | Date) {
  const date = typeof iso === 'string' ? new Date(iso) : iso
  if (Number.isNaN(date.getTime())) return ''
  return date.toLocaleString('en-GB', {
    timeZone: ZONE, weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
    hour: 'numeric', minute: '2-digit', hour12: true,
  }) + ' (EAT)'
}
