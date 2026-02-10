/**
 * Protected Route Component
 * આ component authenticated users માટે admin routes protect કરે છે
 */

'use client'

import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

export default function ProtectedRoute({ children }) {
  const { user, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login')
    }
  }, [user, loading, router])

  // Show nothing if not authenticated (will redirect)
  if (!user) {
    return null
  }

  // Show children if authenticated
  return children
}