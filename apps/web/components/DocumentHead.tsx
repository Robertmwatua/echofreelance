import Head from 'next/head'
import { SITE_NAME } from '../lib/brand'

export default function DocumentHead({ title }: { title?: string }) {
  return (
    <Head>
      <title>{title || SITE_NAME}</title>
      <link rel="icon" href="/favicon.png" type="image/png" />
      <link rel="apple-touch-icon" href="/favicon.png" />
      <meta name="theme-color" content="#0f172a" />
    </Head>
  )
}
