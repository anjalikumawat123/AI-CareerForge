/**
 * pages/AnalyticsPage.jsx
 */

import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'
import AppNav from '../components/AppNav.jsx'
import { getAnalytics } from '../api/analytics.js'

function ScoreBar({ label, score, color }) {
  return (
    <div>
      <div className="flex justify-between mb-1">
        <span className="text-xs font-medium text-gray-600">{label}</span>
        <span className="text-xs font-bold text-gray-800">{score}/100</span>
      </div>
      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
        <div className="h-full rounded-full" style={{ width: `${score}%`, backgroundColor: color, transition: 'width 0.7s ease' }} />
      </div>
    </div>
  )
}

function StatCard({ icon, label, value, sub, color = '#3b82f6' }) {
  return (
    <div className="bg-white border border-gray-200 rounded-2xl p-5">
      <div className="flex items-center gap-3 mb-2">
        <span className="text-2xl">{icon}</span>
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">{label}</p>
      </div>
      <p className="text-3xl font-bold" style={{ color }}>{value}</p>
      {sub && <p className="text-xs text-gray-400 mt-1">{sub}</p>}
    </div>
  )
}

export default function AnalyticsPage() {
  const { token }       = useAuth()
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState(null)

  useEffect(() => {
    getAnalytics(token)
      .then(setData)
      .catch(e => setError(e.message))
      .finally(() => setLoading(false))
  }, [token])

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <AppNav />
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <div className="animate-spin h-8 w-8 border-4 border-blue-600 border-t-transparent rounded-full mx-auto mb-3" />
            <p className="text-sm text-gray-500">Loading analytics…</p>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50">
        <AppNav />
        <div className="max-w-2xl mx-auto px-4 py-20 text-center">
          <p className="text-red-600 text-sm">{error}</p>
        </div>
      </div>
    )
  }

  const d = data || {}

  return (
    <div className="min-h-screen bg-gray-50">
      <AppNav />

      <main className="max-w-6xl mx-auto px-4 py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Career Analytics</h1>
          <p className="text-sm text-gray-500 mt-0.5">Track your career preparation progress</p>
        </div>

        {/* Summary stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <StatCard icon="📄" label="Resumes" value={d.resumeCount ?? 0} sub={`${d.analysisCount ?? 0} analysed`} color="#3b82f6" />
          <StatCard icon="🎯" label="Resume Score" value={d.resumeScore ? `${d.resumeScore}` : '—'} sub="/100 overall" color="#8b5cf6" />
          <StatCard icon="🎤" label="Interviews" value={d.interviewCount ?? 0} sub={`${d.completedInterviews ?? 0} completed`} color="#10b981" />
          <StatCard icon="🔍" label="Job Matches" value={d.jobMatchCount ?? 0} sub={d.avgMatchScore ? `Avg ${d.avgMatchScore}%` : 'None yet'} color="#f59e0b" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          {/* Score breakdown */}
          <div className="bg-white border border-gray-200 rounded-2xl p-6">
            <h2 className="text-sm font-bold text-gray-700 mb-5">Resume Score Breakdown</h2>
            {d.resumeScore > 0 ? (
              <div className="space-y-4">
                <ScoreBar label="Overall Score"     score={d.resumeScore      ?? 0} color="#3b82f6" />
                <ScoreBar label="ATS Score"         score={d.atsScore         ?? 0} color="#14b8a6" />
                <ScoreBar label="Skills Score"      score={d.skillsScore      ?? 0} color="#8b5cf6" />
                <ScoreBar label="Experience Score"  score={d.experienceScore  ?? 0} color="#ec4899" />
                <ScoreBar label="Education Score"   score={d.educationScore   ?? 0} color="#10b981" />
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-sm text-gray-400 mb-3">No resume analysis yet</p>
                <Link to="/resumes" className="text-sm font-semibold text-blue-600 hover:underline">Analyse a resume →</Link>
              </div>
            )}
          </div>

          {/* Interview performance */}
          <div className="bg-white border border-gray-200 rounded-2xl p-6">
            <h2 className="text-sm font-bold text-gray-700 mb-5">Interview Performance</h2>
            {d.completedInterviews > 0 ? (
              <div>
                <div className="flex items-center gap-4 mb-4">
                  <div className="text-center">
                    <p className="text-4xl font-bold text-blue-600">{d.avgInterviewScore ?? 0}%</p>
                    <p className="text-xs text-gray-500">Avg Score</p>
                  </div>
                  <div className="flex-1">
                    <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-blue-500 rounded-full"
                        style={{ width: `${d.avgInterviewScore ?? 0}%`, transition: 'width 0.7s ease' }}
                      />
                    </div>
                    <p className="text-xs text-gray-400 mt-1">{d.completedInterviews} completed of {d.interviewCount} total</p>
                  </div>
                </div>
                {d.recentInterviews?.length > 0 && (
                  <div className="space-y-2">
                    {d.recentInterviews.map(i => (
                      <Link key={i.id} to={`/interview/${i.id}`} className="flex items-center justify-between hover:bg-gray-50 rounded-lg -mx-2 px-2 py-1">
                        <div>
                          <p className="text-sm font-medium text-gray-700">{i.jobRole}</p>
                          <p className="text-xs text-gray-400 capitalize">{i.type} · {i.status}</p>
                        </div>
                        <span className={`text-sm font-bold ${i.avgScore >= 70 ? 'text-green-600' : 'text-blue-600'}`}>
                          {i.avgScore > 0 ? `${i.avgScore}%` : '—'}
                        </span>
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-sm text-gray-400 mb-3">No interviews completed yet</p>
                <Link to="/interview" className="text-sm font-semibold text-blue-600 hover:underline">Start an interview →</Link>
              </div>
            )}
          </div>
        </div>

        {/* Top skills */}
        {d.topSkills?.length > 0 && (
          <div className="bg-white border border-gray-200 rounded-2xl p-6 mb-6">
            <h2 className="text-sm font-bold text-gray-700 mb-4">Detected Skills ({d.skillsCount ?? 0})</h2>
            <div className="flex flex-wrap gap-2">
              {d.topSkills.map((s, i) => (
                <span key={i} className="text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200 px-3 py-1 rounded-full">
                  {s}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Job match history */}
        {d.recentMatches?.length > 0 && (
          <div className="bg-white border border-gray-200 rounded-2xl p-6 mb-6">
            <h2 className="text-sm font-bold text-gray-700 mb-4">Recent Job Matches</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100">
                    <th className="text-left text-xs font-semibold text-gray-500 pb-2">Job Title</th>
                    <th className="text-left text-xs font-semibold text-gray-500 pb-2">Match Score</th>
                    <th className="text-left text-xs font-semibold text-gray-500 pb-2">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {d.recentMatches.map(m => (
                    <tr key={m.id}>
                      <td className="py-2 font-medium text-gray-800">{m.jobTitle || 'Untitled'}</td>
                      <td className="py-2">
                        <span className={`font-bold ${m.matchScore >= 70 ? 'text-green-600' : m.matchScore >= 50 ? 'text-blue-600' : 'text-orange-600'}`}>
                          {m.matchScore}%
                        </span>
                      </td>
                      <td className="py-2 text-gray-400 text-xs">{m.createdAt?.slice(0,10)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Empty state */}
        {!d.resumeCount && !d.interviewCount && !d.jobMatchCount && (
          <div className="bg-white border border-dashed border-gray-300 rounded-2xl p-12 text-center">
            <div className="text-5xl mb-4">📊</div>
            <h3 className="text-lg font-semibold text-gray-700 mb-2">No data yet</h3>
            <p className="text-sm text-gray-500 mb-6">Start by creating a resume, running an analysis, or completing an interview.</p>
            <div className="flex gap-3 justify-center flex-wrap">
              <Link to="/resumes/new" className="bg-blue-600 text-white text-sm font-semibold px-4 py-2 rounded-lg hover:bg-blue-700">Create Resume</Link>
              <Link to="/interview" className="border border-gray-300 text-gray-600 text-sm font-semibold px-4 py-2 rounded-lg hover:bg-gray-50">Start Interview</Link>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
