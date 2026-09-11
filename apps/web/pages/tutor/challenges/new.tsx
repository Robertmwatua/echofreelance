import { useRouter } from 'next/router'
import { useEffect } from 'react'

export default function TutorChallengeRedirect() {
  const router = useRouter()
  useEffect(() => {
    router.replace('/tutor')
  }, [router])
  return null
}
