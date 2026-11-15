import Link from 'next/link'
import DocumentHead from '../components/DocumentHead'
import { SectionLabel } from '../components/ui'
export default function NotFound() {
  return <><DocumentHead title="Page not found — EchoFreelance Tech School"/><main className="ef-status-page mx-auto"><SectionLabel>404 / A wrong turn</SectionLabel><h1 className="ef-title mt-5">This room<br/>isn’t on the map.</h1><p className="ef-muted mt-6 max-w-lg">The link may have moved. There’s still plenty to learn from here.</p><div className="mt-8 flex flex-wrap items-center gap-6"><Link href="/" className="ef-btn">Back to the school →</Link><Link href="/courses" className="ef-btn-ghost">Browse courses</Link></div></main></>
}
