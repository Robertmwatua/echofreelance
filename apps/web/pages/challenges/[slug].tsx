import { RedirectNote } from '../../components/ui'
import { useRouter } from 'next/router'
import { useEffect } from 'react'

export default function ChallengeSlugRedirect() {
  const router = useRouter()
  useEffect(() => {
    router.replace('/discussions')
  }, [router])
  return <RedirectNote href="/discussions"/>
}
