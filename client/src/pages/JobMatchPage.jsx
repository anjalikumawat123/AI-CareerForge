/**
 * pages/JobMatchPage.jsx
 */

import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext.jsx'
import AppNav from '../components/AppNav.jsx'
import { matchJob, getMatches } from '../api/jobMatch.js'
import { listResumes } from '../api/resume.js'

function ScoreCircle({ score }) {
  const color = score >= 75 ? '#22c55e' : score >= 50 ? '#3b82f6' : score >= 30 ? '#f59e0b' : '#ef4444'
  const r = 36, c = 2 * Math.PI * r
  return (
    <div className="flex flex-col items-center gap-1">
      <svg width="90" height="90" viewBox="0 0 90 90">
        <circle cx="45" cy="45" r={r} fill="none" stroke="#e5e7eb" strokeWidth="8" />
        <circle
          cx="45" cy="45" r={r} fill="none" stroke={color} strokeWidth="8"
          strokeDasharray={`${c * score / 100} ${c}`} strokeLinecap="round"
          transform="rotate(-90 45 45)"
        />
        <text x="45" y="50" textAnchor="middle" fontSize="18" fontWeight="bold" fill={color}>{score}%</text>
      </svg>
      <span className="text-xs font-semibold" style={{ color }}>
        {score >= 75 ? 'Strong Match' : score >= 50 ? 'Good Match' : score >= 30 ? 'Partial Match' : 'Low Match'}
      </span>
    </div>
  )
}

function Chips({ items, variant = 'blue' }) {
  if (!items?.length) return <p className="text-sm text-gray-400">None detected.</p>
  const cls = {
    blue:   'bg-blue-50 text-blue-700 border-blue-200',
    green:  'bg-green-50 text-green-700 border-green-200',
    orange: 'bg-orange-50 text-orange-700 border-orange-200',
  }[variant]
  return (
    <div className="flex flex-wrap gap-2">
      {items.map((s, i) => (
        <span key={i} className={`text-xs font-medium border px-2.5 py-0.5 rounded-full ${cls}`}>{s}</span>
      ))}
    </div>
  )
}

export default function JobMatchPage() {
  const { token }  = useAuth()

  const [resumes,      setResumes]      = useState([])
  const [history,      setHistory]      = useState([])
  const [resumeId,     setResumeId]     = useState('')
  const [jobTitle,     setJobTitle]     = useState('')
  const [jobDesc,      setJobDesc]      = useState('')
  const [result,       setResult]       = useState(null)
  const [loading,      setLoading]      = useState(false)
  const [error,        setError]        = useState(null)
  const [loadingData,  setLoadingData]  = useState(true)

  useEffect(() => {
    Promise.all([listResumes(token), getMatches(token)])
      .then(([res, matches]) => {
        setResumes(res.resumes || [])
        setHistory(matches.matches || [])
        if (res.resumes?.length) setResumeId(String(res.resumes[0].id))
      })
      .catch(() => {})
      .finally(() => setLoadingData(false))
  }, [token])

  async function handleSubmit(e) {
    e.preventDefault()
    if (!resumeId) { setError('Please select a resume'); return }
    if (!jobDesc.trim()) { setError('Please paste a job description'); return }
    setLoading(true); setError(null); setResult(null)
    try {
      const data = await matchJob({ resumeId: parseInt(resumeId, 10), jobTitle, jobDescription: jobDesc }, token)
      setResult(data.match)
      setHistory(h => [data.match, ...h.slice(0, 9)])
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <AppNav />

      <main className="max-w-5xl mx-auto px-4 py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Job Description Match</h1>
          <p className="text-sm text-gray-500 mt-0.5">Compare your resume against any job description to see how well you match.</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          {/* Form */}
          <div className="lg:col-span-2">
            <form onSubmit={handleSubmit} className="bg-white border border-gray-200 rounded-2xl p-6 space-y-4">
              <h2 className="text-sm font-bold text-gray-700">Match Your Resume</h2>

              {loadingData ? (
                <div className="h-10 bg-gray-100 rounded-lg animate-pulse" />
              ) : (
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Select Resume</label>
                  <select
                    value={resumeId}
                    onChange={e => setResumeId(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {resumes.map(r => (
                      <option key={r.id} value={r.id}>
                        {r.filename || r.full_name || `Resume #${r.id}`}
                      </option>
                    ))}
                  </select>
                  {resumes.length === 0 && (
                    <p className="text-xs text-orange-600 mt-1">No resumes found. <a href="/resumes/new" className="underline">Create one first.</a></p>
                  )}
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Job Title (optional)</label>
                <input
                  type="text"
                  value={jobTitle}
                  onChange={e => setJobTitle(e.target.value)}
                  placeholder="e.g. Senior Software Engineer"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Job Description <span className="text-red-500">*</span></label>
                <textarea
                  value={jobDesc}
                  onChange={e => setJobDesc(e.target.value)}
                  rows={10}
                  placeholder="Paste the full job description here…"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-vertical"
                />
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                  <p className="text-xs text-red-700">{error}</p>
                </div>
              )}

              <button
                type="submit"
                disabled={loading || !resumeId}
                className="w-full bg-blue-600 text-white text-sm font-semibold py-2.5 rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
              >
                {loading ? 'Analysing…' : '🔍 Analyse Match'}
              </button>
            </form>

            {/* History */}
            {history.length > 0 && (
              <div className="mt-4 bg-white border border-gray-200 rounded-2xl p-4">
                <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-3">Match History</h3>
                <div className="space-y-2">
                  {history.slice(0, 5).map(m => (
                    <div key={m.id} className="flex items-center justify-between text-sm">
                      <span className="text-gray-700 truncate pr-2">{m.job_title || 'Untitled Job'}</span>
                      <span className={`font-bold flex-shrink-0 ${m.match_score >= 70 ? 'text-green-600' : m.match_score >= 50 ? 'text-blue-600' : 'text-orange-600'}`}>
                        {m.match_score}%
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Results */}
          <div className="lg:col-span-3">
            {!result && !loading && (
              <div className="bg-white border border-dashed border-gray-300 rounded-2xl p-12 text-center h-full flex flex-col items-center justify-center">
                <div className="text-4xl mb-3">🔍</div>
                <h3 className="text-base font-semibold text-gray-600 mb-2">No match yet</h3>
                <p className="text-sm text-gray-400">Paste a job description and click Analyse Match to see results.</p>
              </div>
            )}

            {loading && (
              <div className="bg-white border border-gray-200 rounded-2xl p-12 text-center">
                <div className="animate-spin h-8 w-8 border-4 border-blue-600 border-t-transparent rounded-full mx-auto mb-3" />
                <p className="text-sm text-gray-500">Analysing your match…</p>
              </div>
            )}

            {result && (
              <div className="space-y-4">
                {/* Score */}
                <div className="bg-white border border-gray-200 rounded-2xl p-6 flex items-center gap-6">
                  <ScoreCircle score={result.match_score} />
                  <div>
                    <h2 className="text-base font-bold text-gray-800">{result.job_title || 'Job Match'}</h2>
                    <p className="text-sm text-gray-500 mt-1">
                      {result.match_score >= 75
                        ? 'Great match! Your resume aligns well with this role.'
                        : result.match_score >= 50
                        ? 'Good overlap. A few targeted improvements will make you stand out.'
                        : 'Your resume needs tailoring for this specific role.'}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="bg-white border border-gray-200 rounded-xl p-4">
                    <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-3">✅ Matching Skills</h3>
                    <Chips items={result.matching_skills || []} variant="green" />
                  </div>
                  <div className="bg-white border border-gray-200 rounded-xl p-4">
                    <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-3">❌ Missing Skills</h3>
                    <Chips items={result.missing_skills || []} variant="orange" />
                  </div>
                  <div className="bg-white border border-gray-200 rounded-xl p-4">
                    <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-3">🔑 Matching Keywords</h3>
                    <Chips items={result.matching_keywords || []} variant="green" />
                  </div>
                  <div className="bg-white border border-gray-200 rounded-xl p-4">
                    <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-3">⚠️ Missing Keywords</h3>
                    <Chips items={result.missing_keywords || []} variant="orange" />
                  </div>
                </div>

                <div className="bg-white border border-blue-200 rounded-xl p-4">
                  <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-3">💡 Suggestions</h3>
                  <ul className="space-y-2">
                    {(result.suggestions || []).map((s, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                        <span className="mt-1.5 flex-shrink-0 w-1.5 h-1.5 rounded-full bg-blue-400" />
                        {s}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}
