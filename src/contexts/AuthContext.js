/**
 * Authentication Context
 * Manages user authentication state and provides login/logout functions.
 */

'use client'

import { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { apiGet, apiPost } from '@/lib/api'
import { useSettings } from './SettingsContext'

// Default context value for when provider is not mounted
const defaultAuthValue = {
  user: null,
  loading: true,
  login: () => Promise.resolve({ success: false, message: 'Auth not initialized' }),
  logout: () => Promise.resolve(),
  checkAuth: () => Promise.resolve(),
  updateUser: () => {},
}

const AuthContext = createContext(defaultAuthValue)

export const useAuth = () => {
  const context = useContext(AuthContext)
  // Return context directly - default value is already provided via createContext
  return context
}

export default function AuthProvider({ children }) {
  const pathname = usePathname();
  const { refreshSettings, clearSettings } = useSettings();

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
      const data = await apiGet('/api/auth/me', { showLoader: false, includeAuth : true })
      // Transform user data to match frontend expectations
      const transformedUser = {
        id: data.data.id,
        name: `${data.data.full_name}`,
        email: data.data.email,
        phone: data.data.phone_number,
        role: data.data.role_id,
        status: data.data.status === 1 ? 'active' : 'inactive',
        address_1: data.data.address_1 || "",
        address_2: data.data.address_2 || "",
        country_id: data.data.country_id || "",
        state_id: data.data.state_id || "",
        city_id: data.data.city_id || "",
        zipcode: data.data.zipcode || "",
        avatar: data.data.user_image || null,
        permissions: data.data.permissions || {}
      }

      setUser(transformedUser)
      // Cache user data to avoid API calls on subsequent navigations
      localStorage.setItem('cachedUser', JSON.stringify(transformedUser))

      // Fetch settings after user is authenticated
      if (refreshSettings && !silent) {
        await refreshSettings();
      }
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
  }, [refreshSettings])

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

  /**
   * 🔄 Keep authentication state in sync across multiple tabs/windows.
   * When user logs in or logs out in one tab (localStorage changes),
   * other tabs will automatically update their auth state and redirect.
   */
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleStorageChange = (event) => {
      if (event.key === 'accessToken') {
        const newToken = event.newValue;

        // Token removed → treat as logout in this tab as well
        if (!newToken) {
          setUser(null);
          localStorage.removeItem('cachedUser');

          // Avoid redirect loop if we are already on login page
          if (!pathname.startsWith('/login')) {
            router.push('/login');
          }
          return;
        }

        // Token changed/added → re-check auth to sync with latest login
        checkAuth(true);
      }

      if (event.key === 'cachedUser' && !event.newValue) {
        // User cache cleared in another tab → ensure local user cleared
        setUser(null);
      }
    };

    window.addEventListener('storage', handleStorageChange);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [checkAuth, pathname, router])

  const login = async (username, password, rememberMe) => {
    try {
      // Use API helper for login (without auth token)
      const data = await apiPost(
        '/api/auth/login',
        { username, password, rememberMe },
        { includeAuth: false }
      )

      if (data.success) {
        // Backend returns user with fullName structure
        const userName = `${data.data.user.full_name}`

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
          role: data.data.user.role_id,
          status: data.data.user.status === 1 ? 'active' : 'inactive',
          avatar: data.data.user.avatar || null,
          permissions: data.data.user.permissions || {}
        }
        // Set user
        setUser(transformedUser)
        // Cache user data
        localStorage.setItem('cachedUser', JSON.stringify(transformedUser))

        // Fetch settings after successful login
        if (refreshSettings) {
          await refreshSettings();
        }

        return { success: true, message: data.message, user: transformedUser }
      } else {
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

  const logout = async () => {
    try {
      await apiPost('/api/auth/logout');
    } catch { }

    localStorage.removeItem('accessToken');
    localStorage.removeItem('cachedUser');
    document.cookie = 'accessToken=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
    setUser(null);

    // Clear settings on logout
    if (clearSettings) {
      clearSettings();
    }

    router.push('/login');
  };

  // Update user data (e.g., after profile update)
  const updateUser = useCallback((updates) => {
    setUser(prevUser => {
      if (!prevUser) return prevUser;

      const updatedUser = { ...prevUser, ...updates };

      // Update cached user
      localStorage.setItem('cachedUser', JSON.stringify(updatedUser));

      return updatedUser;
    });
  }, []);

  const value = {
    user,
    loading,
    login,
    logout,
    checkAuth,
    updateUser
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}