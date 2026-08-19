/**
 * repositories/interviewRepository.js
 */

import db from '../db/database.js'

const stmtCreateSession = db.prepare(`
  INSERT INTO interview_sessions
    (user_id, job_role, experience_level, interview_type, status, started_at)
  VALUES
    (@userId, @jobRole, @experienceLevel, @interviewType, 'in_progress', @startedAt)
`)

const stmtUpdateSession = db.prepare(`
  UPDATE interview_sessions SET
    status = @status,
    total_score = @totalScore,
    avg_score = @avgScore,
    questions_count = @questionsCount,
    summary = @summary,
    completed_at = @completedAt
  WHERE id = @id AND user_id = @userId
`)

const stmtFindSessionById = db.prepare(
  'SELECT * FROM interview_sessions WHERE id = ? LIMIT 1'
)

const stmtFindSessionsByUser = db.prepare(
  'SELECT * FROM interview_sessions WHERE user_id = ? ORDER BY started_at DESC'
)

const stmtInsertAnswer = db.prepare(`
  INSERT INTO interview_answers
    (session_id, user_id, question_index, question, question_type,
     answer, score, feedback, suggestions, answered_at)
  VALUES
    (@sessionId, @userId, @questionIndex, @question, @questionType,
     @answer, @score, @feedback, @suggestions, @answeredAt)
`)

const stmtFindAnswersBySession = db.prepare(
  'SELECT * FROM interview_answers WHERE session_id = ? ORDER BY question_index ASC'
)

const stmtDeleteSession = db.prepare('DELETE FROM interview_sessions WHERE id = ?')

function deserialiseAnswer(row) {
  if (!row) return null
  return {
    ...row,
    suggestions: typeof row.suggestions === 'string'
      ? (() => { try { return JSON.parse(row.suggestions) } catch { return [] } })()
      : (row.suggestions ?? []),
  }
}

export async function createSession({ userId, jobRole, experienceLevel, interviewType }) {
  const r = stmtCreateSession.run({
    userId, jobRole, experienceLevel, interviewType,
    startedAt: new Date().toISOString(),
  })
  return stmtFindSessionById.get(r.lastInsertRowid)
}

export async function updateSession({ id, userId, status, totalScore, avgScore, questionsCount, summary }) {
  stmtUpdateSession.run({
    id, userId, status, totalScore, avgScore, questionsCount,
    summary: summary ?? '',
    completedAt: status === 'completed' ? new Date().toISOString() : null,
  })
  return stmtFindSessionById.get(id)
}

export async function findSessionById(id) {
  return stmtFindSessionById.get(id) ?? null
}

export async function findSessionsByUser(userId) {
  return stmtFindSessionsByUser.all(userId)
}

export async function insertAnswer({ sessionId, userId, questionIndex, question, questionType, answer, score, feedback, suggestions }) {
  const r = stmtInsertAnswer.run({
    sessionId, userId, questionIndex, question, questionType, answer,
    score: score ?? 0,
    feedback: feedback ?? '',
    suggestions: JSON.stringify(suggestions ?? []),
    answeredAt: new Date().toISOString(),
  })
  return deserialiseAnswer(db.prepare('SELECT * FROM interview_answers WHERE id = ?').get(r.lastInsertRowid))
}

export async function findAnswersBySession(sessionId) {
  return stmtFindAnswersBySession.all(sessionId).map(deserialiseAnswer)
}

export async function deleteSession(id) {
  stmtDeleteSession.run(id)
}
