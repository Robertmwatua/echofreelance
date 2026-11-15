import Head from 'next/head'
import { SITE_NAME } from '../lib/brand'

export default function DocumentHead({ title }: { title?: string }) {
  return (
    <Head>
      <title>{title || SITE_NAME}</title>
      <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" key="viewport" />
      <link rel="icon" href="/favicon.png" type="image/png" />
      <link rel="apple-touch-icon" href="/icons/apple-touch-icon.png" />
      <link rel="manifest" href="/manifest.webmanifest" />
      <meta name="apple-mobile-web-app-capable" content="yes" />
      <meta name="mobile-web-app-capable" content="yes" />
      <meta name="apple-mobile-web-app-title" content="EchoFreelance" />
    </Head>
  )
}
