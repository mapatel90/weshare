/**
 * Authentication Context
 * Manages user authentication state and provides login/logout functions.
 */

'use client'

import { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { apiGet, apiPost } from '@/lib/api'

const AuthContext = createContext({})

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

export default function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const authCheckInProgress = useRef(false)
  const router = useRouter()

  // Get backend URL from environment variable
  const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5000'

  const checkAuth = useCallback(async (silent = false) => {
    // Prevent multiple simultaneous checks
    if (authCheckInProgress.current) {
      return
    }

    try {
      authCheckInProgress.current = true
      const token = localStorage.getItem('accessToken')
      if (!token) {
        setLoading(false)
        localStorage.removeItem('cachedUser')
        return
      }

      // Verify token by calling your backend server using API helper
      // Disable loader for auth check to prevent blocking UI
      const data = await apiGet('/api/auth/me', { showLoader: false })

      // Transform user data to match frontend expectations
      const transformedUser = {
        id: data.data.id,
        name: `${data.data.fullName}`,
        email: data.data.email,
        phone: data.data.phoneNumber,
        role: data.data.userRole,
        status: data.data.status === 1 ? 'active' : 'inactive',
        avatar: data.data.avatar || null
      }

      setUser(transformedUser)
      // Cache user data to avoid API calls on subsequent navigations
      localStorage.setItem('cachedUser', JSON.stringify(transformedUser))
    } catch (error) {
      console.error('Auth check error:', error)
      // Token invalid, remove it
      localStorage.removeItem('accessToken')
      localStorage.removeItem('cachedUser')
      document.cookie = 'accessToken=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;'
      setUser(null)
    } finally {
      authCheckInProgress.current = false
      if (!silent) {
        setLoading(false)
      }
    }
  }, [])

  // Check if user is logged in on app start
  useEffect(() => {
    // Try to load cached user first for instant UI
    const cachedUser = localStorage.getItem('cachedUser')
    if (cachedUser) {
      try {
        const parsedUser = JSON.parse(cachedUser)
        setUser(parsedUser)
        setLoading(false)
        // Still verify in background, but don't block UI
        checkAuth(true)
        return
      } catch (e) {
        // Cache corrupted, clear it
        localStorage.removeItem('cachedUser')
      }
    }
    
    // No cache, check auth normally
    checkAuth(false)
  }, [checkAuth])

  const login = async (username, password) => {
    try {
      // Use API helper for login (without auth token)
      const data = await apiPost(
        '/api/auth/login',
        { username, password },
        { includeAuth: false }
      )

      console.log('📡 Login API response:', data)

      if (data.success) {
        // Backend returns user with fullName structure
        const userName = `${data.data.user.fullName}`
        console.log('✅ Login successful for user:', userName)

        // Store token (backend returns 'token', not 'accessToken')
        localStorage.setItem('accessToken', data.data.token)

        // Set cookie for middleware only 2 hours
        document.cookie = `accessToken=${data.data.token}; path=/; max-age=7200` // 2 hours

        // Transform user data to match frontend expectations
        const transformedUser = {
          id: data.data.user.id,
          name: userName,
          email: data.data.user.email,
          phone: data.data.user.phoneNumber,
          role: data.data.user.userRole,
          status: data.data.user.status === 1 ? 'active' : 'inactive',
          avatar: data.data.user.avatar || null
        }
        // Set user
        setUser(transformedUser)
        // Cache user data
        localStorage.setItem('cachedUser', JSON.stringify(transformedUser))

        // Redirect to dashboard
        if (transformedUser.userRole === 3) {
          router.push('/offtaker/dashboards/analytics')
        } else if (transformedUser.userRole === 4) {
          router.push('/investor/dashboards/analytics')
        } else {
          router.push('/admin/dashboards/analytics')
        }

        return { success: true, message: data.message }
      } else {
        console.log('❌ Login failed:', data.message)
        return { success: false, message: data.message }
      }
    } catch (error) {
      console.error('❌ Login error:', error)
      return {
        success: false,
        message: error.message || `Network error. Please check your backend server is running at ${BACKEND_URL}`
      }
    }
  }

  const logout = () => {
    // Clear storage
    localStorage.removeItem('accessToken')
    localStorage.removeItem('cachedUser')

    // Clear cookie
    document.cookie = 'accessToken=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;'

    // Clear user
    setUser(null)
    authCheckInProgress.current = false

    // Redirect to login
    router.push('/login')
  }

  const value = {
    user,
    loading,
    login,
    logout,
    checkAuth
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}