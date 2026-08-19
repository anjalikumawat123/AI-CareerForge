/**
 * pages/DashboardPage.jsx
 */

import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'
import AppNav from '../components/AppNav.jsx'
import { getAnalytics } from '../api/analytics.js'

function StatCard({ label, value, sub, color = 'blue' }) {
  const colors = {
    blue:   'bg-blue-50 border-blue-200 text-blue-700',
    green:  'bg-green-50 border-green-200 text-green-700',
    purple: 'bg-purple-50 border-purple-200 text-purple-700',
    orange: 'bg-orange-50 border-orange-200 text-orange-700',
  }
  return (
    <div className={`border rounded-xl p-4 ${colors[color]}`}>
      <p className="text-xs font-semibold uppercase tracking-wide opacity-70">{label}</p>
      <p className="text-3xl font-bold mt-1">{value}</p>
      {sub && <p className="text-xs mt-1 opacity-70">{sub}</p>}
    </div>
  )
}

function FeatureCard({ to, icon, title, desc, badge, badgeColor = 'blue', stat, statLabel }) {
  const badgeColors = {
    blue:  'bg-blue-100 text-blue-700',
    green: 'bg-green-100 text-green-700',
    gray:  'bg-gray-100 text-gray-500',
  }
  return (
    <Link
      to={to}
      className="bg-white border border-gray-200 rounded-2xl p-6 hover:shadow-md hover:border-blue-300 transition-all group flex flex-col"
    >
      <div className="flex items-start justify-between">
        <span className="text-3xl">{icon}</span>
        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${badgeColors[badgeColor]}`}>
          {badge}
        </span>
      </div>
      <h3 className="mt-3 font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
        {title}
      </h3>
      <p className="mt-1 text-sm text-gray-500 flex-1">{desc}</p>
      {stat !== undefined && (
        <div className="mt-3 pt-3 border-t border-gray-100">
          <span className="text-lg font-bold text-gray-800">{stat}</span>
          <span className="text-xs text-gray-500 ml-1">{statLabel}</span>
        </div>
      )}
    </Link>
  )
}

export default function DashboardPage() {
  const { user, token } = useAuth()
  const [stats, setStats]     = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getAnalytics(token)
      .then(setStats)
      .catch(() => setStats(null))
      .finally(() => setLoading(false))
  }, [token])

  return (
    <div className="min-h-screen bg-gray-50">
      <AppNav />

      <main className="max-w-6xl mx-auto px-4 py-8">
        {/* Welcome */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">
            Welcome back, {user?.name?.split(' ')[0] || 'there'} 👋
          </h1>
          <p className="text-gray-500 mt-1 text-sm">
            Here's your career progress at a glance.
          </p>
        </div>

        {/* Stats row */}
        {!loading && stats && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <StatCard
              label="Resume Score"
              value={stats.resumeScore ? `${stats.resumeScore}/100` : '—'}
              sub={stats.analysisCount > 0 ? `${stats.analysisCount} analyses` : 'No analysis yet'}
              color="blue"
            />
            <StatCard
              label="Interviews"
              value={stats.interviewCount ?? 0}
              sub={`${stats.completedInterviews ?? 0} completed`}
              color="purple"
            />
            <StatCard
              label="Avg Interview Score"
              value={stats.avgInterviewScore ? `${stats.avgInterviewScore}%` : '—'}
              sub="Across completed sessions"
              color="green"
            />
            <StatCard
              label="Job Matches"
              value={stats.jobMatchCount ?? 0}
              sub={stats.avgMatchScore ? `Avg ${stats.avgMatchScore}% match` : 'No matches yet'}
              color="orange"
            />
          </div>
        )}

        {loading && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            {[1,2,3,4].map(i => (
              <div key={i} className="bg-gray-100 rounded-xl h-24 animate-pulse" />
            ))}
          </div>
        )}

        {/* Feature cards */}
        <h2 className="text-sm font-bold text-gray-500 uppercase tracking-wide mb-4">Your Tools</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <FeatureCard
            to="/resumes"
            icon="📄"
            title="Resume Builder"
            desc="Create, edit, and manage your professional resumes."
            badge="Active"
            badgeColor="green"
            stat={stats?.resumeCount ?? '—'}
            statLabel="resumes"
          />
          <FeatureCard
            to="/resumes"
            icon="🎯"
            title="Resume Analysis"
            desc="Upload your PDF resume and get an AI-powered analysis with scores, skills, and job recommendations."
            badge="Active"
            badgeColor="green"
            stat={stats?.resumeScore ? `${stats.resumeScore}/100` : '—'}
            statLabel="score"
          />
          <FeatureCard
            to="/job-match"
            icon="🔍"
            title="Job Match"
            desc="Compare your resume against any job description."
            badge="Active"
            badgeColor="green"
            stat={stats?.avgMatchScore ? `${stats.avgMatchScore}%` : '—'}
            statLabel="avg match"
          />
          <FeatureCard
            to="/interview"
            icon="🎤"
            title="Interview Simulator"
            desc="Practice with AI-evaluated interview questions."
            badge="Active"
            badgeColor="green"
            stat={stats?.avgInterviewScore ? `${stats.avgInterviewScore}%` : '—'}
            statLabel="avg score"
          />
        </div>

        {/* Recent activity */}
        {stats && (stats.recentInterviews?.length > 0 || stats.recentMatches?.length > 0) && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {stats.recentInterviews?.length > 0 && (
              <div className="bg-white border border-gray-200 rounded-2xl p-6">
                <h3 className="text-sm font-bold text-gray-700 mb-4">Recent Interviews</h3>
                <div className="space-y-3">
                  {stats.recentInterviews.map(i => (
                    <Link key={i.id} to={`/interview/${i.id}`} className="flex items-center justify-between hover:bg-gray-50 -mx-2 px-2 py-1 rounded-lg">
                      <div>
                        <p className="text-sm font-medium text-gray-800">{i.jobRole || 'Interview Session'}</p>
                        <p className="text-xs text-gray-500 capitalize">{i.type} · {i.status}</p>
                      </div>
                      <span className={`text-sm font-bold ${i.avgScore >= 70 ? 'text-green-600' : i.avgScore >= 50 ? 'text-blue-600' : 'text-orange-600'}`}>
                        {i.avgScore > 0 ? `${i.avgScore}%` : '—'}
                      </span>
                    </Link>
                  ))}
                </div>
              </div>
            )}
            {stats.recentMatches?.length > 0 && (
              <div className="bg-white border border-gray-200 rounded-2xl p-6">
                <h3 className="text-sm font-bold text-gray-700 mb-4">Recent Job Matches</h3>
                <div className="space-y-3">
                  {stats.recentMatches.map(m => (
                    <div key={m.id} className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-800">{m.jobTitle || 'Job Match'}</p>
                        <p className="text-xs text-gray-500">{m.createdAt?.slice(0,10)}</p>
                      </div>
                      <span className={`text-sm font-bold ${m.matchScore >= 70 ? 'text-green-600' : m.matchScore >= 50 ? 'text-blue-600' : 'text-orange-600'}`}>
                        {m.matchScore}%
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  )
}
