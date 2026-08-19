/**
 * components/AppNav.jsx
 * Consistent navigation bar for all authenticated pages.
 */

import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'
import { logoutRequest } from '../api/auth.js'

const NAV_LINKS = [
  { to: '/dashboard',  label: 'Dashboard' },
  { to: '/resumes',    label: 'Resumes'   },
  { to: '/job-match',  label: 'Job Match' },
  { to: '/interview',  label: 'Interview' },
  { to: '/analytics',  label: 'Analytics' },
]

export default function AppNav() {
  const { user, token, logout } = useAuth()
  const navigate   = useNavigate()
  const location   = useLocation()
  const [open, setOpen] = useState(false)

  async function handleLogout() {
    try { await logoutRequest(token) } catch { /* ignore */ }
    logout()
    navigate('/', { replace: true })
  }

  function isActive(to) {
    return location.pathname === to || location.pathname.startsWith(to + '/')
  }

  return (
    <header className="bg-white border-b border-gray-200 shadow-sm sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-between h-14">
          {/* Logo */}
          <Link to="/dashboard" className="text-lg font-extrabold text-blue-600 tracking-tight flex-shrink-0">
            AI CareerForge
          </Link>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-1">
            {NAV_LINKS.map(({ to, label }) => (
              <Link
                key={to}
                to={to}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive(to)
                    ? 'bg-blue-50 text-blue-700'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                }`}
              >
                {label}
              </Link>
            ))}
          </nav>

          {/* User + logout (desktop) */}
          <div className="hidden md:flex items-center gap-3">
            <span className="text-sm text-gray-500">
              {user?.name && <span className="font-medium text-gray-800">{user.name}</span>}
            </span>
            <button
              onClick={handleLogout}
              className="text-sm font-medium text-gray-500 hover:text-red-600 transition-colors px-2 py-1"
            >
              Sign out
            </button>
          </div>

          {/* Mobile hamburger */}
          <button
            className="md:hidden p-2 rounded-lg text-gray-500 hover:bg-gray-100"
            onClick={() => setOpen(!open)}
            aria-label="Toggle menu"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {open
                ? <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                : <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              }
            </svg>
          </button>
        </div>

        {/* Mobile menu */}
        {open && (
          <div className="md:hidden border-t border-gray-100 py-2">
            {NAV_LINKS.map(({ to, label }) => (
              <Link
                key={to}
                to={to}
                onClick={() => setOpen(false)}
                className={`block px-3 py-2 rounded-lg text-sm font-medium mb-0.5 ${
                  isActive(to) ? 'bg-blue-50 text-blue-700' : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                {label}
              </Link>
            ))}
            <div className="border-t border-gray-100 mt-2 pt-2 px-3 flex items-center justify-between">
              <span className="text-sm text-gray-500">{user?.name}</span>
              <button onClick={handleLogout} className="text-sm font-medium text-red-600">Sign out</button>
            </div>
          </div>
        )}
      </div>
    </header>
  )
}
