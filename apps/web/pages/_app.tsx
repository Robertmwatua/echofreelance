import '../styles/tokens.css'
import '../styles/globals.css'
import '../styles/editorial-home.css'
import '../styles/workspaces.css'
import '../styles/interaction-hierarchy.css'
import '../styles/compact-home.css'
import '../styles/faq-footer.css'
import '../styles/catalogue.css'
import '../styles/admin.css'
import '../styles/theme-surfaces.css'
import '../styles/school-chat.css'
import type { AppProps } from 'next/app'
import { SiteShell } from '../components/SiteShell'
import DocumentHead from '../components/DocumentHead'

export default function App({ Component, pageProps }: AppProps) {
  return (
    <>
      <DocumentHead />
      <SiteShell>
        <Component {...pageProps} />
      </SiteShell>
    </>
  )
}
