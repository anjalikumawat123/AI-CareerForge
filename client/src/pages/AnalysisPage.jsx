/**
 * pages/AnalysisPage.jsx
 * Resume analysis results — polished, responsive, detailed.
 */

import { useState, useEffect } from 'react'
import { Link, useParams, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'
import AppNav from '../components/AppNav.jsx'
import { getAnalysis, runAnalysis } from '../api/analysis.js'

// ── Sub-components ─────────────────────────────────────────────────────────

function ScoreRing({ score, size = 120 }) {
  const radius = size * 0.38
  const circ   = 2 * Math.PI * radius
  const filled = circ * (score / 100)
  const color  = score >= 75 ? '#22c55e' : score >= 50 ? '#3b82f6' : score >= 30 ? '#f59e0b' : '#ef4444'
  const label  = score >= 75 ? 'Excellent' : score >= 50 ? 'Good' : score >= 30 ? 'Fair' : 'Needs Work'

  return (
    <div className="flex flex-col items-center gap-2">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <circle cx={size/2} cy={size/2} r={radius} fill="none" stroke="#e5e7eb" strokeWidth="10" />
        <circle
          cx={size/2} cy={size/2} r={radius}
          fill="none" stroke={color} strokeWidth="10"
          strokeDasharray={`${filled} ${circ}`} strokeLinecap="round"
          transform={`rotate(-90 ${size/2} ${size/2})`}
          style={{ transition: 'stroke-dasharray 0.8s ease' }}
        />
        <text x={size/2} y={size/2 + 8} textAnchor="middle" fontSize={size*0.2} fontWeight="bold" fill={color}>
          {score}
        </text>
        <text x={size/2} y={size/2 + size*0.18} textAnchor="middle" fontSize={size*0.09} fill="#9ca3af">
          / 100
        </text>
      </svg>
      <span className="text-xs font-semibold px-2 py-0.5 rounded-full" style={{ background: `${color}20`, color }}>
        {label}
      </span>
    </div>
  )
}

function ScoreBar({ label, score, color = '#3b82f6' }) {
  return (
    <div>
      <div className="flex justify-between items-center mb-1">
        <span className="text-xs font-medium text-gray-600">{label}</span>
        <span className="text-xs font-bold text-gray-800">{score}/100</span>
      </div>
      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-700"
          style={{ width: `${score}%`, backgroundColor: color }}
        />
      </div>
    </div>
  )
}

function Card({ title, icon, children, accent }) {
  return (
    <div className={`bg-white border rounded-2xl p-6 ${accent ? 'border-blue-200' : 'border-gray-200'}`}>
      <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-4">{icon} {title}</h3>
      {children}
    </div>
  )
}

function BulletList({ items, color }) {
  if (!items?.length) return <p className="text-sm text-gray-400">None detected.</p>
  return (
    <ul className="space-y-2">
      {items.map((item, i) => (
        <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
          <span className={`mt-1.5 flex-shrink-0 w-1.5 h-1.5 rounded-full ${color}`} />
          {item}
        </li>
      ))}
    </ul>
  )
}

function Chips({ items, variant = 'blue' }) {
  if (!items?.length) return <p className="text-sm text-green-600 font-medium">✓ No gaps detected.</p>
  const cls = {
    blue:   'bg-blue-50 text-blue-700 border-blue-200',
    orange: 'bg-orange-50 text-orange-700 border-orange-200',
    green:  'bg-green-50 text-green-700 border-green-200',
  }[variant]
  return (
    <div className="flex flex-wrap gap-2">
      {items.map((s, i) => (
        <span key={i} className={`text-xs font-medium border px-3 py-1 rounded-full ${cls}`}>{s}</span>
      ))}
    </div>
  )
}

function JobRoleCard({ roles }) {
  if (!roles?.length) return <p className="text-sm text-gray-400">No role matches detected.</p>
  return (
    <div className="space-y-2">
      {roles.map((role, i) => {
        // parse "Role Name (XX% match)" format
        const match = role.match(/^(.+?)\s*\((\d+)%\s*match\)$/)
        const label = match ? match[1] : role
        const pct   = match ? parseInt(match[2], 10) : null
        const color = pct >= 50 ? '#22c55e' : pct >= 30 ? '#3b82f6' : '#9ca3af'
        return (
          <div key={i} className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-gray-700">{label}</span>
            </div>
            {pct !== null && (
              <span
                className="text-xs font-bold px-2 py-0.5 rounded-full"
                style={{ background: `${color}20`, color }}
              >
                {pct}% match
              </span>
            )}
          </div>
        )
      })}
    </div>
  )
}

// ── Main page ──────────────────────────────────────────────────────────────

export default function AnalysisPage() {
  const { id }      = useParams()
  const { token }   = useAuth()
  const navigate    = useNavigate()

  const [analysis,    setAnalysis]    = useState(null)
  const [loading,     setLoading]     = useState(true)
  const [error,       setError]       = useState(null)
  const [reanalysing, setReanalysing] = useState(false)

  useEffect(() => { loadAnalysis() }, [id]) // eslint-disable-line

  async function loadAnalysis() {
    setLoading(true); setError(null)
    try {
      const data = await getAnalysis(Number(id), token)
      setAnalysis(data.analysis)
    } catch (err) {
      if (err.status === 404) setAnalysis(null)   // not yet analysed
      else                    setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  async function handleReanalyse() {
    setReanalysing(true); setError(null)
    try {
      const data = await runAnalysis(Number(id), token)
      setAnalysis(data.analysis)
    } catch (err) {
      setError(err.message)
    } finally {
      setReanalysing(false)
    }
  }

  // ── Loading ────────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <AppNav />
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <div className="animate-spin h-10 w-10 border-4 border-blue-600 border-t-transparent rounded-full mx-auto mb-4" />
            <p className="text-sm text-gray-500">Loading analysis…</p>
          </div>
        </div>
      </div>
    )
  }

  // ── Error ──────────────────────────────────────────────────────────────────
  if (error) {
    return (
      <div className="min-h-screen bg-gray-50">
        <AppNav />
        <div className="max-w-2xl mx-auto px-4 py-20 text-center">
          <div className="text-4xl mb-4">⚠️</div>
          <h2 className="text-lg font-bold text-gray-800 mb-2">Analysis Unavailable</h2>
          <p className="text-sm text-gray-500 mb-6">{error}</p>
          <button
            onClick={() => navigate('/resumes')}
            className="bg-blue-600 text-white text-sm font-semibold px-5 py-2.5 rounded-lg hover:bg-blue-700"
          >
            ← Back to Resumes
          </button>
        </div>
      </div>
    )
  }

  // ── Not yet analysed ───────────────────────────────────────────────────────
  if (!analysis) {
    return (
      <div className="min-h-screen bg-gray-50">
        <AppNav />
        <div className="max-w-2xl mx-auto px-4 py-20 text-center">
          <div className="text-5xl mb-4">🎯</div>
          <h2 className="text-xl font-bold text-gray-800 mb-2">No Analysis Yet</h2>
          <p className="text-sm text-gray-500 mb-6">
            This resume has not been analysed. Click below to run the analysis engine.
          </p>
          <button
            onClick={handleReanalyse}
            disabled={reanalysing}
            className="bg-blue-600 text-white text-sm font-semibold px-6 py-2.5 rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
          >
            {reanalysing ? 'Analysing…' : '✦ Run Analysis'}
          </button>
        </div>
      </div>
    )
  }

  const date = analysis.analysed_at
    ? new Date(analysis.analysed_at).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })
    : '—'

  const scoreCats = [
    { label: 'Skills',      score: analysis.skills_score     ?? 0, color: '#3b82f6' },
    { label: 'Experience',  score: analysis.experience_score ?? 0, color: '#8b5cf6' },
    { label: 'Education',   score: analysis.education_score  ?? 0, color: '#10b981' },
    { label: 'Projects',    score: analysis.projects_score   ?? 0, color: '#f59e0b' },
    { label: 'Formatting',  score: analysis.formatting_score ?? 0, color: '#6366f1' },
    { label: 'Keywords',    score: analysis.keyword_score    ?? 0, color: '#ec4899' },
    { label: 'ATS Score',   score: analysis.ats_score        ?? 0, color: '#14b8a6' },
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      <AppNav />

      <main className="max-w-5xl mx-auto px-4 py-8">

        {/* Header row */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Resume Analysis</h1>
            <p className="text-xs text-gray-400 mt-1">
              Analysed {date} · Provider: <span className="font-medium">{analysis.provider}</span>
            </p>
          </div>
          <div className="flex gap-2">
            <Link
              to={`/resumes/${id}/edit`}
              className="text-sm font-medium border border-gray-300 text-gray-600 px-4 py-2 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Edit Resume
            </Link>
            <button
              onClick={handleReanalyse}
              disabled={reanalysing}
              className="text-sm font-semibold bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
            >
              {reanalysing ? 'Re-analysing…' : '↺ Re-analyse'}
            </button>
          </div>
        </div>

        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg px-4 py-3">
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        {/* Overall score + score bars */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <div className="bg-white border border-gray-200 rounded-2xl p-6 flex flex-col items-center justify-center">
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-4">Overall Score</p>
            <ScoreRing score={analysis.score ?? 0} />
          </div>

          <div className="md:col-span-2 bg-white border border-gray-200 rounded-2xl p-6">
            <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-5">Score Breakdown</h3>
            <div className="space-y-3">
              {scoreCats.map(({ label, score, color }) => (
                <ScoreBar key={label} label={label} score={score} color={color} />
              ))}
            </div>
          </div>
        </div>

        {/* Detected skills */}
        <div className="mb-6">
          <Card title={`Detected Skills (${(analysis.skills || []).length})`} icon="🛠">
            <Chips items={analysis.skills || []} variant="blue" />
          </Card>
        </div>

        {/* Strengths + Weaknesses */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <Card title="Strengths" icon="✅">
            <BulletList items={analysis.strengths || []} color="bg-green-400" />
          </Card>
          <Card title="Weaknesses" icon="⚠️">
            <BulletList items={analysis.weaknesses || []} color="bg-red-400" />
          </Card>
        </div>

        {/* Missing skills + keywords */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <Card title="Missing Skills" icon="📌">
            <Chips items={analysis.missing_skills || []} variant="orange" />
          </Card>
          <Card title="Missing Keywords" icon="🔑">
            <Chips items={analysis.missing_keywords || []} variant="orange" />
          </Card>
        </div>

        {/* Detected keywords */}
        {(analysis.keywords || []).length > 0 && (
          <div className="mb-6">
            <Card title="Detected Keywords" icon="✨">
              <Chips items={analysis.keywords || []} variant="green" />
            </Card>
          </div>
        )}

        {/* Suggestions */}
        <div className="mb-6">
          <Card title="Improvement Suggestions" icon="💡" accent>
            <BulletList items={analysis.suggestions || []} color="bg-blue-400" />
          </Card>
        </div>

        {/* Experience + Education summaries */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <Card title="Experience Summary" icon="💼">
            <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-line">
              {analysis.experience_summary || 'No experience section detected.'}
            </p>
          </Card>
          <Card title="Education Summary" icon="🎓">
            <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-line">
              {analysis.education_summary || 'No education section detected.'}
            </p>
          </Card>
        </div>

        {/* ATS Feedback */}
        <div className="mb-6">
          <Card title="ATS & Readability Feedback" icon="🤖">
            <p className="text-sm text-gray-600 leading-relaxed">
              {analysis.ats_feedback || 'No ATS feedback available.'}
            </p>
          </Card>
        </div>

        {/* Job Role Recommendations */}
        <div className="mb-10">
          <Card title="Job Role Recommendations" icon="💼" accent>
            <p className="text-xs text-gray-400 mb-4">
              Based on your detected skills, these roles match your profile best.
            </p>
            <JobRoleCard roles={analysis.job_role_recommendations || []} />
          </Card>
        </div>

        {/* Bottom actions */}
        <div className="flex flex-wrap gap-3 justify-center pb-4">
          <Link
            to="/resumes"
            className="text-sm font-medium border border-gray-300 text-gray-600 px-4 py-2 rounded-lg hover:bg-gray-50"
          >
            ← All Resumes
          </Link>
          <Link
            to="/job-match"
            className="text-sm font-semibold bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700"
          >
            🔍 Match to Job
          </Link>
          <button
            onClick={() => window.print()}
            className="text-sm font-medium border border-gray-300 text-gray-600 px-4 py-2 rounded-lg hover:bg-gray-50"
          >
            🖨 Print
          </button>
        </div>

      </main>
    </div>
  )
}
