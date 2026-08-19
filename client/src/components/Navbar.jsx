import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'
import { logoutRequest } from '../api/auth.js'

function Navbar() {
  const { user, token, logout } = useAuth()
  const navigate = useNavigate()

  async function handleLogout() {
    try {
      await logoutRequest(token)
    } catch {
      // Clear local state regardless of server response
    }
    logout()
    navigate('/', { replace: true })
  }

  return (
    <header className="bg-white border-b border-gray-200 shadow-sm">
      <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
        {/* Logo */}
        <div className="flex items-center gap-2">
          <Link to="/" className="text-2xl font-extrabold text-blue-600 tracking-tight">
            AI CareerForge
          </Link>
          <span className="text-xs bg-blue-100 text-blue-700 font-semibold px-2 py-0.5 rounded-full">
            Beta
          </span>
        </div>

        {/* Nav links */}
        <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-gray-600">
          <Link to="/" className="hover:text-blue-600 transition-colors">Home</Link>
          <a href="#features" className="hover:text-blue-600 transition-colors">Features</a>
          <a href="#about"    className="hover:text-blue-600 transition-colors">About</a>
        </nav>

        {/* Auth buttons — live state */}
        <div className="flex items-center gap-3">
          {user ? (
            <>
              <span className="hidden sm:block text-sm text-gray-600">
                Hi, <span className="font-semibold text-gray-900">{user.name}</span>
              </span>
              <Link
                to="/dashboard"
                className="text-sm font-medium text-blue-600 hover:underline"
              >
                Dashboard
              </Link>
              <button
                onClick={handleLogout}
                className="text-sm font-medium text-gray-500 hover:text-red-600 transition-colors"
              >
                Sign out
              </button>
            </>
          ) : (
            <>
              <Link
                to="/login"
                className="text-sm font-medium text-gray-600 hover:text-blue-600 transition-colors"
              >
                Log in
              </Link>
              <Link
                to="/register"
                className="text-sm font-semibold bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
              >
                Sign up
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  )
}

export default Navbar
