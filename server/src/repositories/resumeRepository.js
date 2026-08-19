/**
 * repositories/resumeRepository.js
 * Data-access layer for the resumes table.
 * Supports both PDF-upload resumes and form-based structured resumes.
 */

import db from '../db/database.js'

const JSON_COLS = ['education', 'skills', 'experience', 'projects', 'certifications', 'achievements']

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

// ---------------------------------------------------------------------------
// Prepared statements
// ---------------------------------------------------------------------------

const stmtInsert = db.prepare(`
  INSERT INTO resumes (
    user_id, filename, stored_name, file_size, mime_type, uploaded_at,
    full_name, email, phone, location, linkedin, github, portfolio,
    summary, education, skills, experience, projects, certifications,
    achievements, resume_type
  )
  VALUES (
    @userId, @filename, @storedName, @fileSize, @mimeType, @uploadedAt,
    @fullName, @email, @phone, @location, @linkedin, @github, @portfolio,
    @summary, @education, @skills, @experience, @projects, @certifications,
    @achievements, @resumeType
  )
`)

const stmtUpdate = db.prepare(`
  UPDATE resumes SET
    filename = @filename,
    full_name = @fullName,
    email = @email,
    phone = @phone,
    location = @location,
    linkedin = @linkedin,
    github = @github,
    portfolio = @portfolio,
    summary = @summary,
    education = @education,
    skills = @skills,
    experience = @experience,
    projects = @projects,
    certifications = @certifications,
    achievements = @achievements
  WHERE id = @id AND user_id = @userId
`)

const stmtFindByUserId = db.prepare(
  'SELECT * FROM resumes WHERE user_id = ? ORDER BY uploaded_at DESC'
)

const stmtFindById = db.prepare('SELECT * FROM resumes WHERE id = ? LIMIT 1')

const stmtDeleteById = db.prepare('DELETE FROM resumes WHERE id = ?')

// ---------------------------------------------------------------------------
// Repository methods
// ---------------------------------------------------------------------------

export async function insertResume({
  userId, filename, storedName = '', fileSize = 0, mimeType = 'application/pdf',
  fullName = '', email = '', phone = '', location = '', linkedin = '', github = '',
  portfolio = '', summary = '', education = [], skills = [], experience = [],
  projects = [], certifications = [], achievements = [], resumeType = 'pdf',
}) {
  const uploadedAt = new Date().toISOString()
  const result = stmtInsert.run({
    userId, filename, storedName, fileSize, mimeType, uploadedAt,
    fullName, email, phone, location, linkedin, github, portfolio, summary,
    education:      JSON.stringify(education),
    skills:         JSON.stringify(skills),
    experience:     JSON.stringify(experience),
    projects:       JSON.stringify(projects),
    certifications: JSON.stringify(certifications),
    achievements:   JSON.stringify(achievements),
    resumeType,
  })
  return deserialise(stmtFindById.get(result.lastInsertRowid))
}

export async function updateResume({
  id, userId, filename, fullName, email, phone, location, linkedin, github,
  portfolio, summary, education, skills, experience, projects, certifications, achievements,
}) {
  stmtUpdate.run({
    id, userId, filename,
    fullName: fullName ?? '',
    email:    email    ?? '',
    phone:    phone    ?? '',
    location: location ?? '',
    linkedin: linkedin ?? '',
    github:   github   ?? '',
    portfolio:portfolio ?? '',
    summary:  summary  ?? '',
    education:      JSON.stringify(education      ?? []),
    skills:         JSON.stringify(skills         ?? []),
    experience:     JSON.stringify(experience     ?? []),
    projects:       JSON.stringify(projects       ?? []),
    certifications: JSON.stringify(certifications ?? []),
    achievements:   JSON.stringify(achievements   ?? []),
  })
  return deserialise(stmtFindById.get(id))
}

export async function findByUserId(userId) {
  return stmtFindByUserId.all(userId).map(deserialise)
}

export async function findById(id) {
  return deserialise(stmtFindById.get(id)) ?? null
}

export async function deleteById(id) {
  const result = stmtDeleteById.run(id)
  return result.changes > 0
}
