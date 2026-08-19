/**
 * repositories/jobMatchRepository.js
 */

import db from '../db/database.js'

const JSON_COLS = ['matching_skills', 'missing_skills', 'matching_keywords', 'missing_keywords', 'suggestions']

function deserialise(row) {
  if (!row) return null
  const out = { ...row }
  for (const col of JSON_COLS) {
    if (typeof out[col] === 'string') {
      try { out[col] = JSON.parse(out[col]) } catch { out[col] = [] }
    }
  }
  return out
}

const stmtInsert = db.prepare(`
  INSERT INTO job_matches
    (resume_id, user_id, job_title, job_description, match_score,
     matching_skills, missing_skills, matching_keywords, missing_keywords,
     suggestions, created_at)
  VALUES
    (@resumeId, @userId, @jobTitle, @jobDescription, @matchScore,
     @matchingSkills, @missingSkills, @matchingKeywords, @missingKeywords,
     @suggestions, @createdAt)
`)

const stmtFindByUser = db.prepare(
  'SELECT * FROM job_matches WHERE user_id = ? ORDER BY created_at DESC'
)

const stmtFindById = db.prepare('SELECT * FROM job_matches WHERE id = ? LIMIT 1')

export async function saveMatch({ resumeId, userId, jobTitle, jobDescription, matchScore,
  matchingSkills, missingSkills, matchingKeywords, missingKeywords, suggestions }) {
  const r = stmtInsert.run({
    resumeId, userId, jobTitle, jobDescription, matchScore,
    matchingSkills:   JSON.stringify(matchingSkills   ?? []),
    missingSkills:    JSON.stringify(missingSkills    ?? []),
    matchingKeywords: JSON.stringify(matchingKeywords ?? []),
    missingKeywords:  JSON.stringify(missingKeywords  ?? []),
    suggestions:      JSON.stringify(suggestions      ?? []),
    createdAt:        new Date().toISOString(),
  })
  return deserialise(stmtFindById.get(r.lastInsertRowid))
}

export async function findByUser(userId) {
  return stmtFindByUser.all(userId).map(deserialise)
}

export async function findById(id) {
  return deserialise(stmtFindById.get(id)) ?? null
}
