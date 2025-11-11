'use client'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function OfftakerDashboard() {
  const router = useRouter()

  useEffect(() => {
    // Redirect to analytics dashboard
    router.replace('/offtaker/dashboards/analytics')
  }, [router])

  return (
    <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '400px' }}>
      <div className="spinner-border text-primary" role="status">
        <span className="visually-hidden">Loading...</span>
      </div>
    </div>
  )
}
