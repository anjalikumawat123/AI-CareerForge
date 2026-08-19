/**
 * context/AuthContext.jsx
 * Global authentication state for the whole React app.
 *
 * Provides:
 *   user       — { id, name, email } | null
 *   token      — JWT string | null
 *   loading    — true while we are verifying a stored token on startup
 *   login(token, user)  — call this after a successful /api/auth/login
 *   logout()            — clears state + localStorage
 *
 * Usage:
 *   const { user, login, logout } = useAuth()
 */

import { createContext, useContext, useEffect, useState } from 'react'
import { getMe } from '../api/auth.js'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser]       = useState(null)
  const [token, setToken]     = useState(null)
  const [loading, setLoading] = useState(true)  // checking stored token

  // On first render: restore session from localStorage
  useEffect(() => {
    const stored = localStorage.getItem('cf_token')
    if (stored) {
      // Validate the stored token with the server
      getMe(stored)
        .then((data) => {
          setToken(stored)
          setUser(data.user)
        })
        .catch(() => {
          // Token is invalid or expired — clear it
          localStorage.removeItem('cf_token')
        })
        .finally(() => setLoading(false))
    } else {
      setLoading(false)
    }
  }, [])

  /** Call this after a successful register or login response */
  function login(newToken, newUser) {
    localStorage.setItem('cf_token', newToken)
    setToken(newToken)
    setUser(newUser)
  }

  /** Clear all auth state */
  function logout() {
    localStorage.removeItem('cf_token')
    setToken(null)
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, token, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

/** Hook — throws if used outside <AuthProvider> */
export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>')
  return ctx
}
