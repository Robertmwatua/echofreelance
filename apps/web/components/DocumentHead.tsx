import Head from 'next/head'

export default function DocumentHead({ title = 'EchoFreelance' }: { title?: string }) {
  return (
    <Head>
      <title>{title}</title>
    </Head>
  )
}
