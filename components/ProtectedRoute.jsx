'use client'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'

export default function ProtectedRoute({ children }) {
  const router = useRouter()
  const [authorized, setAuthorized] = useState(false)

  useEffect(() => {
    const loggedIn = localStorage.getItem('loggedIn')
    if (loggedIn === 'true') {
      setAuthorized(true)
    } else {
      router.push('/login')
    }
  }, [router])

  if (!authorized) return null // nothing until verified
  return <>{children}</>
}
