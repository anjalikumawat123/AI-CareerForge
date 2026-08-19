/**
 * pages/InterviewPage.jsx
 * Interview simulator — session list + start new session.
 */

import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'
import AppNav from '../components/AppNav.jsx'
import { createSession, getSessions, deleteSession } from '../api/interview.js'

const JOB_ROLES = [
  'Software Engineer', 'Frontend Developer', 'Backend Developer', 'Full Stack Developer',
  'Data Scientist', 'Data Analyst', 'DevOps Engineer', 'Product Manager',
  'UI/UX Designer', 'Machine Learning Engineer', 'Mobile Developer', 'Cloud Architect',
  'Security Engineer', 'QA Engineer', 'Business Analyst',
]

const EXP_LEVELS = [
  { value: 'junior',  label: 'Junior (0–2 years)' },
  { value: 'mid',     label: 'Mid-level (2–5 years)' },
  { value: 'senior',  label: 'Senior (5+ years)' },
]

const INT_TYPES = [
  { value: 'technical',  label: 'Technical', icon: '💻' },
  { value: 'behavioral', label: 'Behavioral', icon: '🤝' },
  { value: 'hr',         label: 'HR', icon: '👔' },
  { value: 'mixed',      label: 'Mixed', icon: '🔀' },
]

function formatDate(iso) {
  return new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
}

export default function InterviewPage() {
  const { token }  = useAuth()
  const navigate   = useNavigate()

  const [sessions,    setSessions]    = useState([])
  const [loading,     setLoading]     = useState(true)
  const [starting,    setStarting]    = useState(false)
  const [error,       setError]       = useState(null)
  const [deletingId,  setDeletingId]  = useState(null)

  const [jobRole,   setJobRole]   = useState('Software Engineer')
  const [expLevel,  setExpLevel]  = useState('junior')
  const [intType,   setIntType]   = useState('mixed')

  useEffect(() => {
    getSessions(token)
      .then(data => setSessions(data.sessions || []))
      .catch(() => setSessions([]))
      .finally(() => setLoading(false))
  }, [token])

  async function handleStart(e) {
    e.preventDefault()
    setStarting(true); setError(null)
    try {
      const data = await createSession({ jobRole, experienceLevel: expLevel, interviewType: intType }, token)
      navigate(`/interview/${data.session.id}`)
    } catch (e) {
      setError(e.message)
      setStarting(false)
    }
  }

  async function handleDelete(id) {
    if (!window.confirm('Delete this interview session?')) return
    setDeletingId(id)
    try {
      await deleteSession(id, token)
      setSessions(s => s.filter(x => x.id !== id))
    } catch { /* ignore */ } finally {
      setDeletingId(null)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <AppNav />

      <main className="max-w-5xl mx-auto px-4 py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Interview Simulator</h1>
          <p className="text-sm text-gray-500 mt-0.5">Practice with realistic interview questions and get instant feedback.</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          {/* Start form */}
          <div className="lg:col-span-2">
            <form onSubmit={handleStart} className="bg-white border border-gray-200 rounded-2xl p-6 space-y-5">
              <h2 className="text-sm font-bold text-gray-700">Start New Interview</h2>

              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Job Role</label>
                <select
                  value={jobRole}
                  onChange={e => setJobRole(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {JOB_ROLES.map(r => <option key={r} value={r}>{r}</option>)}
                </select>
                <input
                  type="text"
                  value={jobRole}
                  onChange={e => setJobRole(e.target.value)}
                  placeholder="Or type a custom role…"
                  className="w-full mt-2 border border-gray-200 rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-blue-400"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-2">Experience Level</label>
                <div className="space-y-1.5">
                  {EXP_LEVELS.map(l => (
                    <label key={l.value} className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="expLevel"
                        value={l.value}
                        checked={expLevel === l.value}
                        onChange={() => setExpLevel(l.value)}
                        className="accent-blue-600"
                      />
                      <span className="text-sm text-gray-700">{l.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-2">Interview Type</label>
                <div className="grid grid-cols-2 gap-2">
                  {INT_TYPES.map(t => (
                    <button
                      key={t.value}
                      type="button"
                      onClick={() => setIntType(t.value)}
                      className={`border rounded-lg px-3 py-2 text-sm font-medium text-left transition-colors ${
                        intType === t.value
                          ? 'border-blue-500 bg-blue-50 text-blue-700'
                          : 'border-gray-200 text-gray-600 hover:border-gray-300'
                      }`}
                    >
                      {t.icon} {t.label}
                    </button>
                  ))}
                </div>
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                  <p className="text-xs text-red-700">{error}</p>
                </div>
              )}

              <button
                type="submit"
                disabled={starting}
                className="w-full bg-blue-600 text-white text-sm font-semibold py-2.5 rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
              >
                {starting ? 'Starting…' : '🎤 Start Interview'}
              </button>
            </form>
          </div>

          {/* Session history */}
          <div className="lg:col-span-3">
            <h2 className="text-sm font-bold text-gray-500 uppercase tracking-wide mb-3">Session History</h2>

            {loading && (
              <div className="space-y-3">
                {[1,2,3].map(i => <div key={i} className="bg-white border border-gray-200 rounded-xl h-20 animate-pulse" />)}
              </div>
            )}

            {!loading && sessions.length === 0 && (
              <div className="bg-white border border-dashed border-gray-300 rounded-2xl p-10 text-center">
                <div className="text-4xl mb-3">🎤</div>
                <p className="text-sm text-gray-500">No interviews yet. Start your first session!</p>
              </div>
            )}

            {!loading && sessions.length > 0 && (
              <div className="space-y-3">
                {sessions.map(s => (
                  <div key={s.id} className="bg-white border border-gray-200 rounded-xl px-5 py-4 flex items-center justify-between gap-4">
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-gray-800 truncate">{s.job_role}</p>
                      <p className="text-xs text-gray-400 mt-0.5 capitalize">
                        {s.interview_type} · {s.experience_level} · {formatDate(s.started_at)}
                      </p>
                      {s.status === 'completed' && (
                        <p className="text-xs text-green-600 font-medium mt-0.5">
                          ✓ Completed · Score: {Math.round(s.avg_score)}%
                        </p>
                      )}
                      {s.status === 'in_progress' && (
                        <p className="text-xs text-orange-500 font-medium mt-0.5">⏳ In progress</p>
                      )}
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <Link
                        to={`/interview/${s.id}`}
                        className="text-xs font-semibold bg-blue-600 text-white px-3 py-1.5 rounded-lg hover:bg-blue-700"
                      >
                        {s.status === 'completed' ? 'View' : 'Continue'}
                      </Link>
                      <button
                        onClick={() => handleDelete(s.id)}
                        disabled={deletingId === s.id}
                        className="text-xs text-red-500 hover:text-red-700 px-2 py-1 disabled:opacity-50"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}
