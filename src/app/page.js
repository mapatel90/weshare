'use client'

import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

export default function Home() {
  const { user, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading) {
      if (user) {
        // User is authenticated, redirect to dashboard
        router.push('/admin/dashboards/analytics')
      } else {
        // User is not authenticated, redirect to login
        router.push('/login')
      }
    }
  }, [user, loading, router])

  // Show loading while checking authentication
  // Commented out - using global loader instead
  // if (loading) {
  //   return (
  //     <div className="d-flex justify-content-center align-items-center" style={{ height: '100vh' }}>
  //       <div className="spinner-border text-primary" role="status">
  //         <span className="visually-hidden">Loading...</span>
  //       </div>
  //     </div>
  //   )
  // }

  return null
}