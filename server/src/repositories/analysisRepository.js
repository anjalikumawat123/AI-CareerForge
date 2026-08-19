/**
 * repositories/analysisRepository.js
 * Data-access layer for the resume_analyses table.
 */

import db from '../db/database.js'

// ---------------------------------------------------------------------------
// JSON helpers
// ---------------------------------------------------------------------------

const JSON_COLS_SNAKE = [
  'skills', 'strengths', 'weaknesses', 'missing_skills',
  'missing_keywords', 'suggestions', 'keywords', 'job_role_recommendations',
]

function deserialise(row) {
  if (!row) return null
  const out = { ...row }
  for (const col of JSON_COLS_SNAKE) {
    if (typeof out[col] === 'string') {
      try { out[col] = JSON.parse(out[col]) } catch { out[col] = [] }
    }
  }
  return out
}

// ---------------------------------------------------------------------------
// Statements
// ---------------------------------------------------------------------------

const stmtDeleteExisting = db.prepare('DELETE FROM resume_analyses WHERE resume_id = ?')

const stmtInsert = db.prepare(`
  INSERT INTO resume_analyses
    (resume_id, user_id, score, ats_score, skills_score, experience_score,
     education_score, projects_score, formatting_score, keyword_score,
     skills, strengths, weaknesses, missing_skills, missing_keywords,
     suggestions, keywords, job_role_recommendations, experience_summary,
     education_summary, ats_feedback, provider, analysed_at)
  VALUES
    (@resumeId, @userId, @score, @atsScore, @skillsScore, @experienceScore,
     @educationScore, @projectsScore, @formattingScore, @keywordScore,
     @skills, @strengths, @weaknesses, @missingSkills, @missingKeywords,
     @suggestions, @keywords, @jobRoleRecommendations, @experienceSummary,
     @educationSummary, @atsFeedback, @provider, @analysedAt)
`)

const stmtFindByResumeId = db.prepare(
  'SELECT * FROM resume_analyses WHERE resume_id = ? LIMIT 1'
)

const stmtFindByUserId = db.prepare(
  'SELECT * FROM resume_analyses WHERE user_id = ? ORDER BY analysed_at DESC'
)

// ---------------------------------------------------------------------------
// Repository methods
// ---------------------------------------------------------------------------

export async function upsertAnalysis(data) {
  const row = {
    resumeId:                data.resumeId,
    userId:                  data.userId,
    score:                   data.score             ?? 0,
    atsScore:                data.atsScore          ?? 0,
    skillsScore:             data.skillsScore       ?? 0,
    experienceScore:         data.experienceScore   ?? 0,
    educationScore:          data.educationScore    ?? 0,
    projectsScore:           data.projectsScore     ?? 0,
    formattingScore:         data.formattingScore   ?? 0,
    keywordScore:            data.keywordScore      ?? 0,
    skills:                  JSON.stringify(data.skills                 ?? []),
    strengths:               JSON.stringify(data.strengths              ?? []),
    weaknesses:              JSON.stringify(data.weaknesses             ?? []),
    missingSkills:           JSON.stringify(data.missingSkills          ?? []),
    missingKeywords:         JSON.stringify(data.missingKeywords        ?? []),
    suggestions:             JSON.stringify(data.suggestions            ?? []),
    keywords:                JSON.stringify(data.keywords               ?? []),
    jobRoleRecommendations:  JSON.stringify(data.jobRoleRecommendations ?? []),
    experienceSummary:       data.experienceSummary ?? '',
    educationSummary:        data.educationSummary  ?? '',
    atsFeedback:             data.atsFeedback       ?? '',
    provider:                data.provider          ?? 'local',
    analysedAt:              new Date().toISOString(),
  }

  // Delete existing analysis for this resume, then insert fresh
  stmtDeleteExisting.run(data.resumeId)
  stmtInsert.run(row)
  return deserialise(stmtFindByResumeId.get(data.resumeId))
}

export async function findByResumeId(resumeId) {
  return deserialise(stmtFindByResumeId.get(resumeId))
}

export async function findByUserId(userId) {
  return stmtFindByUserId.all(userId).map(deserialise)
}
