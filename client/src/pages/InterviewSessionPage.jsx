/**
 * pages/InterviewSessionPage.jsx
 * Active interview session — shows one question at a time with feedback.
 */

import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'
import AppNav from '../components/AppNav.jsx'
import { getSession, submitAnswer, completeSession } from '../api/interview.js'

function ScoreRing({ score, size = 80 }) {
  const r = size * 0.38, c = 2 * Math.PI * r
  const color = score >= 75 ? '#22c55e' : score >= 50 ? '#3b82f6' : score >= 30 ? '#f59e0b' : '#ef4444'
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="#e5e7eb" strokeWidth="8" />
      <circle
        cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth="8"
        strokeDasharray={`${c * score / 100} ${c}`} strokeLinecap="round"
        transform={`rotate(-90 ${size/2} ${size/2})`}
      />
      <text x={size/2} y={size/2 + 5} textAnchor="middle" fontSize={size*0.22} fontWeight="bold" fill={color}>{score}</text>
    </svg>
  )
}

export default function InterviewSessionPage() {
  const { id }    = useParams()
  const { token } = useAuth()
  const navigate  = useNavigate()

  const [session,     setSession]     = useState(null)
  const [questions,   setQuestions]   = useState([])
  const [answers,     setAnswers]     = useState([])
  const [current,     setCurrent]     = useState(0)
  const [answer,      setAnswer]      = useState('')
  const [feedback,    setFeedback]    = useState(null)
  const [submitting,  setSubmitting]  = useState(false)
  const [completing,  setCompleting]  = useState(false)
  const [loading,     setLoading]     = useState(true)
  const [error,       setError]       = useState(null)
  const [summary,     setSummary]     = useState(null)

  useEffect(() => { load() }, [id]) // eslint-disable-line

  async function load() {
    setLoading(true)
    try {
      const data = await getSession(parseInt(id, 10), token)
      setSession(data.session)
      setQuestions(data.questions || [])
      setAnswers(data.answers || [])

      if (data.session.status === 'completed') {
        setSummary({
          session:  data.session,
          answers:  data.answers,
          questions: data.questions,
        })
      } else {
        // Resume from where we left off
        setCurrent(data.answers?.length || 0)
      }
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  async function handleSubmit() {
    if (!answer.trim()) return
    const q = questions[current]
    if (!q) return
    setSubmitting(true)
    try {
      const data = await submitAnswer(parseInt(id, 10), {
        questionIndex: current,
        question:      q.q,
        questionType:  q.type,
        answer,
      }, token)
      setFeedback(data.answer)
      setAnswers(data.allAnswers)
    } catch (e) {
      setError(e.message)
    } finally {
      setSubmitting(false)
    }
  }

  function handleNext() {
    setFeedback(null)
    setAnswer('')
    if (current < questions.length - 1) {
      setCurrent(c => c + 1)
    }
  }

  async function handleComplete() {
    setCompleting(true)
    try {
      const data = await completeSession(parseInt(id, 10), token)
      setSummary({ session: data.session, answers: data.answers, questions })
      setSession(data.session)
    } catch (e) {
      setError(e.message)
    } finally {
      setCompleting(false)
    }
  }

  // ── Loading ────────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <AppNav />
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <div className="animate-spin h-8 w-8 border-4 border-blue-600 border-t-transparent rounded-full mx-auto mb-3" />
            <p className="text-sm text-gray-500">Loading session…</p>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50">
        <AppNav />
        <div className="max-w-xl mx-auto px-4 py-20 text-center">
          <p className="text-red-600 text-sm mb-4">{error}</p>
          <Link to="/interview" className="text-sm text-blue-600 hover:underline">← Back to Interviews</Link>
        </div>
      </div>
    )
  }

  // ── Summary / completed ───────────────────────────────────────────────────
  if (summary) {
    const avg  = summary.session?.avg_score ?? 0
    const total = summary.answers?.length ?? 0

    return (
      <div className="min-h-screen bg-gray-50">
        <AppNav />
        <main className="max-w-3xl mx-auto px-4 py-8">
          <div className="bg-white border border-gray-200 rounded-2xl p-8 mb-6 text-center">
            <div className="text-5xl mb-4">🏆</div>
            <h1 className="text-2xl font-bold text-gray-900 mb-1">Interview Complete!</h1>
            <p className="text-sm text-gray-500 mb-6">{summary.session?.job_role} · {summary.session?.interview_type}</p>
            <div className="flex justify-center gap-8 mb-6">
              <div>
                <p className="text-3xl font-bold text-blue-600">{Math.round(avg)}%</p>
                <p className="text-xs text-gray-500">Average Score</p>
              </div>
              <div>
                <p className="text-3xl font-bold text-green-600">{total}</p>
                <p className="text-xs text-gray-500">Questions</p>
              </div>
              <div>
                <p className="text-3xl font-bold text-purple-600">
                  {avg >= 75 ? 'Excellent' : avg >= 60 ? 'Good' : avg >= 45 ? 'Fair' : 'Needs Work'}
                </p>
                <p className="text-xs text-gray-500">Rating</p>
              </div>
            </div>
            {summary.session?.summary && (
              <p className="text-sm text-gray-600 bg-gray-50 rounded-xl p-4 text-left mb-4">
                {summary.session.summary}
              </p>
            )}
            <div className="flex gap-3 justify-center">
              <Link to="/interview" className="border border-gray-300 text-gray-600 text-sm font-medium px-4 py-2 rounded-lg hover:bg-gray-50">
                All Interviews
              </Link>
              <Link to="/analytics" className="bg-blue-600 text-white text-sm font-semibold px-4 py-2 rounded-lg hover:bg-blue-700">
                View Analytics
              </Link>
            </div>
          </div>

          {/* Answer review */}
          <h2 className="text-sm font-bold text-gray-700 mb-3">Answer Review</h2>
          <div className="space-y-4">
            {summary.answers?.map((a, i) => (
              <div key={a.id || i} className="bg-white border border-gray-200 rounded-xl p-5">
                <div className="flex items-start justify-between gap-4 mb-3">
                  <p className="text-sm font-semibold text-gray-800">{a.question}</p>
                  <div className="flex-shrink-0">
                    <ScoreRing score={a.score} size={60} />
                  </div>
                </div>
                <div className="bg-gray-50 rounded-lg p-3 mb-3">
                  <p className="text-xs font-semibold text-gray-500 mb-1">Your answer:</p>
                  <p className="text-sm text-gray-700">{a.answer || '(no answer)'}</p>
                </div>
                <div className="bg-blue-50 rounded-lg p-3">
                  <p className="text-xs font-semibold text-blue-700 mb-1">Feedback:</p>
                  <p className="text-sm text-blue-800">{a.feedback}</p>
                  {a.suggestions?.length > 0 && (
                    <ul className="mt-2 space-y-1">
                      {a.suggestions.map((s, j) => (
                        <li key={j} className="text-xs text-blue-700 flex items-start gap-1">
                          <span className="mt-1">•</span> {s}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            ))}
          </div>
        </main>
      </div>
    )
  }

  const q = questions[current]
  const alreadyAnswered = answers.find(a => a.question_index === current)
  const isLastQuestion  = current === questions.length - 1
  const allAnswered     = answers.length >= questions.length

  return (
    <div className="min-h-screen bg-gray-50">
      <AppNav />

      <main className="max-w-3xl mx-auto px-4 py-8">
        {/* Progress */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <div>
              <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">{session?.job_role}</span>
              <span className="text-xs text-gray-400 ml-2 capitalize">· {session?.interview_type} · {session?.experience_level}</span>
            </div>
            <span className="text-xs font-medium text-gray-500">
              {current + 1} / {questions.length}
            </span>
          </div>
          <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-blue-500 rounded-full transition-all"
              style={{ width: `${((current + 1) / questions.length) * 100}%` }}
            />
          </div>
        </div>

        {q ? (
          <div className="bg-white border border-gray-200 rounded-2xl p-6 mb-4">
            {/* Question */}
            <div className="mb-5">
              <span className="text-xs font-semibold uppercase tracking-wide text-blue-600 bg-blue-50 px-2 py-0.5 rounded capitalize">
                {q.type}
              </span>
              <h2 className="text-base font-semibold text-gray-800 mt-2">{q.q}</h2>
            </div>

            {/* Already answered — show previous answer */}
            {alreadyAnswered && !feedback && (
              <div className="mb-4">
                <div className="bg-gray-50 rounded-lg p-3 mb-3">
                  <p className="text-xs font-semibold text-gray-500 mb-1">Your answer:</p>
                  <p className="text-sm text-gray-700">{alreadyAnswered.answer}</p>
                </div>
                <div className="bg-blue-50 rounded-lg p-3">
                  <p className="text-xs font-semibold text-blue-700 mb-1">Feedback (score: {alreadyAnswered.score}/100):</p>
                  <p className="text-sm text-blue-800">{alreadyAnswered.feedback}</p>
                </div>
              </div>
            )}

            {/* Answer input — only if not answered */}
            {!alreadyAnswered && !feedback && (
              <div className="mb-4">
                <label className="block text-xs font-semibold text-gray-600 mb-2">Your Answer</label>
                <textarea
                  value={answer}
                  onChange={e => setAnswer(e.target.value)}
                  rows={6}
                  placeholder="Type your answer here. Be specific and give examples…"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-vertical"
                />
                <p className="text-xs text-gray-400 mt-1">{answer.split(/\s+/).filter(Boolean).length} words</p>
              </div>
            )}

            {/* Feedback */}
            {feedback && (
              <div className="mb-4">
                <div className="bg-gray-50 rounded-lg p-3 mb-3">
                  <p className="text-xs font-semibold text-gray-500 mb-1">Your answer:</p>
                  <p className="text-sm text-gray-700">{feedback.answer}</p>
                </div>
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <div className="flex items-center gap-3 mb-2">
                    <ScoreRing score={feedback.score} size={60} />
                    <div>
                      <p className="text-sm font-bold text-gray-800">Score: {feedback.score}/100</p>
                      <p className="text-sm text-gray-700">{feedback.feedback}</p>
                    </div>
                  </div>
                  {feedback.suggestions?.length > 0 && (
                    <ul className="mt-3 space-y-1">
                      {feedback.suggestions.map((s, i) => (
                        <li key={i} className="text-xs text-green-800 flex items-start gap-1">
                          <span className="mt-1">•</span> {s}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            )}

            {error && (
              <div className="mb-4 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                <p className="text-xs text-red-700">{error}</p>
              </div>
            )}

            {/* Actions */}
            <div className="flex items-center justify-between">
              <button
                onClick={() => { if (current > 0) { setCurrent(c => c - 1); setFeedback(null); setAnswer('') } }}
                disabled={current === 0}
                className="text-sm text-gray-500 hover:text-gray-700 disabled:opacity-30 px-3 py-1.5"
              >
                ← Previous
              </button>
              <div className="flex gap-2">
                {!alreadyAnswered && !feedback && (
                  <button
                    onClick={handleSubmit}
                    disabled={submitting || !answer.trim()}
                    className="bg-blue-600 text-white text-sm font-semibold px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
                  >
                    {submitting ? 'Submitting…' : 'Submit Answer'}
                  </button>
                )}
                {(feedback || alreadyAnswered) && !isLastQuestion && (
                  <button
                    onClick={handleNext}
                    className="bg-blue-600 text-white text-sm font-semibold px-4 py-2 rounded-lg hover:bg-blue-700"
                  >
                    Next Question →
                  </button>
                )}
                {(allAnswered || (feedback && isLastQuestion)) && (
                  <button
                    onClick={handleComplete}
                    disabled={completing}
                    className="bg-green-600 text-white text-sm font-semibold px-4 py-2 rounded-lg hover:bg-green-700 disabled:opacity-50"
                  >
                    {completing ? 'Finishing…' : '✓ Complete Interview'}
                  </button>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-white border border-gray-200 rounded-2xl p-8 text-center">
            <p className="text-gray-500">No questions available for this configuration.</p>
          </div>
        )}

        {/* Answer progress dots */}
        <div className="flex justify-center gap-2 mt-4">
          {questions.map((_, i) => {
            const ans = answers.find(a => a.question_index === i)
            return (
              <button
                key={i}
                onClick={() => { setCurrent(i); setFeedback(null); setAnswer('') }}
                className={`w-3 h-3 rounded-full transition-colors ${
                  i === current ? 'bg-blue-600' : ans ? 'bg-green-400' : 'bg-gray-200'
                }`}
              />
            )
          })}
        </div>
      </main>
    </div>
  )
}
