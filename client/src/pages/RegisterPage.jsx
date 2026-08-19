/**
 * pages/RegisterPage.jsx
 * Professional sign-up page, consistent with the AI CareerForge design.
 */

import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { register } from '../api/auth.js'
import { useAuth } from '../context/AuthContext.jsx'

function RegisterPage() {
  const { login } = useAuth()
  const navigate  = useNavigate()

  const [form, setForm]       = useState({ name: '', email: '', password: '' })
  const [errors, setErrors]   = useState([])
  const [loading, setLoading] = useState(false)

  function handleChange(e) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }))
    setErrors([])
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setLoading(true)
    setErrors([])

    try {
      const data = await register(form)
      login(data.token, data.user)
      navigate('/dashboard', { replace: true })
    } catch (err) {
      setErrors(err.errors ?? [err.message])
    } finally {
      setLoading(false)
    }
  }

  // Password strength indicator
  const pwLen = form.password.length
  const strength =
    pwLen === 0 ? null :
    pwLen < 8   ? { label: 'Too short', color: 'bg-red-400',    width: 'w-1/4' } :
    pwLen < 12  ? { label: 'Fair',      color: 'bg-yellow-400', width: 'w-2/4' } :
    pwLen < 16  ? { label: 'Good',      color: 'bg-blue-400',   width: 'w-3/4' } :
                  { label: 'Strong',    color: 'bg-green-500',  width: 'w-full' }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 px-4">
      <div className="mx-auto w-full max-w-md">

        {/* Brand */}
        <div className="text-center mb-8">
          <Link to="/" className="text-2xl font-extrabold text-blue-600 tracking-tight">
            AI CareerForge
          </Link>
          <p className="mt-2 text-sm text-gray-500">Create your free account</p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
          <h1 className="text-xl font-bold text-gray-900 mb-6">Get started</h1>

          {/* Error messages */}
          {errors.length > 0 && (
            <div className="mb-5 bg-red-50 border border-red-200 rounded-lg p-3">
              {errors.map((e, i) => (
                <p key={i} className="text-sm text-red-700">{e}</p>
              ))}
            </div>
          )}

          <form onSubmit={handleSubmit} noValidate className="space-y-5">
            {/* Full name */}
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                Full name
              </label>
              <input
                id="name"
                name="name"
                type="text"
                autoComplete="name"
                required
                value={form.name}
                onChange={handleChange}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                placeholder="Priya Sharma"
              />
            </div>

            {/* Email */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                Email address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={form.email}
                onChange={handleChange}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                placeholder="you@university.edu"
              />
            </div>

            {/* Password */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="new-password"
                required
                value={form.password}
                onChange={handleChange}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                placeholder="Min. 8 characters"
              />
              {/* Strength bar */}
              {strength && (
                <div className="mt-2">
                  <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
                    <div className={`h-full rounded-full transition-all duration-300 ${strength.color} ${strength.width}`} />
                  </div>
                  <p className="text-xs text-gray-400 mt-1">Strength: {strength.label}</p>
                </div>
              )}
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 text-white font-semibold py-2.5 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-60 disabled:cursor-not-allowed text-sm"
            >
              {loading ? 'Creating account…' : 'Create free account'}
            </button>
          </form>

          {/* Terms note */}
          <p className="mt-4 text-center text-xs text-gray-400">
            By signing up you agree to our Terms of Service and Privacy Policy.
          </p>

          <p className="mt-4 text-center text-sm text-gray-500">
            Already have an account?{' '}
            <Link to="/login" className="text-blue-600 font-medium hover:underline">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}

export default RegisterPage
