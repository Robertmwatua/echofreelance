import Head from 'next/head'

export default function DocumentHead({ title = 'EchoFreelance' }: { title?: string }) {
  return (
    <Head>
      <title>{title}</title>
      <link rel="icon" href="/favicon.png" type="image/png" />
      <link rel="apple-touch-icon" href="/favicon.png" />
      <meta name="theme-color" content="#0f172a" />
    </Head>
  )
}
