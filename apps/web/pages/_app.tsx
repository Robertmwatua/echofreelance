import '../styles/globals.css'
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
