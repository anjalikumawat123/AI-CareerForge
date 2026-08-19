/**
 * controllers/analyticsController.js
 */

import db from '../db/database.js'

function handleError(err, res) {
  console.error('[analyticsController]', err)
  return res.status(500).json({ error: 'Internal server error' })
}

export async function getAnalyticsHandler(req, res) {
  try {
    const userId = req.user.userId

    // Resume stats
    const resumes     = db.prepare('SELECT * FROM resumes WHERE user_id = ?').all(userId)
    const analyses    = db.prepare('SELECT * FROM resume_analyses WHERE user_id = ? ORDER BY analysed_at DESC').all(userId)
    const latestAn    = analyses[0] ?? null

    // Interview stats
    const sessions    = db.prepare("SELECT * FROM interview_sessions WHERE user_id = ? AND status = 'completed'").all(userId)
    const allSessions = db.prepare('SELECT * FROM interview_sessions WHERE user_id = ?').all(userId)

    const avgInterviewScore = sessions.length
      ? Math.round(sessions.reduce((s, i) => s + (i.avg_score || 0), 0) / sessions.length)
      : 0

    // Job match stats
    const jobMatches    = db.prepare('SELECT * FROM job_matches WHERE user_id = ? ORDER BY created_at DESC').all(userId)
    const avgMatchScore = jobMatches.length
      ? Math.round(jobMatches.reduce((s, m) => s + (m.match_score || 0), 0) / jobMatches.length)
      : 0

    // Skills from latest analysis
    let skills = []
    if (latestAn && latestAn.skills) {
      try { skills = JSON.parse(latestAn.skills) } catch { skills = [] }
    }

    // Score history for chart
    const scoreHistory = analyses.slice(0, 10).reverse().map(a => ({
      date:  a.analysed_at ? a.analysed_at.slice(0, 10) : '',
      score: a.score ?? 0,
    }))

    const matchHistory = jobMatches.slice(0, 10).reverse().map(m => ({
      title: m.job_title || 'Job Match',
      score: m.match_score ?? 0,
    }))

    return res.json({
      resumeCount:       resumes.length,
      analysisCount:     analyses.length,
      resumeScore:       latestAn?.score        ?? 0,
      atsScore:          latestAn?.ats_score     ?? 0,
      skillsScore:       latestAn?.skills_score  ?? 0,
      experienceScore:   latestAn?.experience_score ?? 0,
      educationScore:    latestAn?.education_score  ?? 0,
      interviewCount:    allSessions.length,
      completedInterviews: sessions.length,
      avgInterviewScore,
      jobMatchCount:     jobMatches.length,
      avgMatchScore,
      skillsCount:       skills.length,
      topSkills:         skills.slice(0, 8),
      scoreHistory,
      matchHistory,
      recentInterviews:  allSessions.slice(0, 5).map(s => ({
        id:          s.id,
        jobRole:     s.job_role,
        type:        s.interview_type,
        avgScore:    s.avg_score ? Math.round(s.avg_score) : 0,
        status:      s.status,
        startedAt:   s.started_at,
      })),
      recentMatches: jobMatches.slice(0, 5).map(m => ({
        id:         m.id,
        jobTitle:   m.job_title,
        matchScore: m.match_score,
        createdAt:  m.created_at,
      })),
    })
  } catch (err) { return handleError(err, res) }
}
