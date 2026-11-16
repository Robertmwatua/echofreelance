import { Head, Html, Main, NextScript } from 'next/document'
import {THEME_BOOTSTRAP} from '../lib/theme'

export default function Document() {
  return (
    <Html lang="en">
      <Head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          href="https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,500;12..96,600;12..96,700;12..96,800&family=JetBrains+Mono:wght@400;500&family=Inter:wght@400;500;600;700;800&display=swap&subset=latin"
          rel="stylesheet"
        />
        <script
          dangerouslySetInnerHTML={{
            __html: THEME_BOOTSTRAP,
          }}
        />
      </Head>
      <body>
        <Main />
        <NextScript />
      </body>
    </Html>
  )
}
