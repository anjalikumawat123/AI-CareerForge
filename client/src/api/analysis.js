/**
 * api/analysis.js
 * Fetch calls related to resume AI analysis.
 */

const BASE = import.meta.env.VITE_API_URL ?? ''

async function parseError(res) {
  const body = await res.json().catch(() => ({}))
  const message =
    body.error ??
    (Array.isArray(body.errors) ? body.errors[0] : null) ??
    `Request failed (${res.status})`
  const err = new Error(message)
  err.status = res.status
  return err
}

/**
 * POST /api/resumes/:id/analyse
 * Triggers analysis (or re-analysis) of a resume.
 * @param {number} resumeId
 * @param {string} token
 * @returns {{ message, analysis }}
 */
export async function runAnalysis(resumeId, token) {
  const res = await fetch(`${BASE}/api/resumes/${resumeId}/analyse`, {
    method:  'POST',
    headers: { Authorization: `Bearer ${token}` },
  })
  if (!res.ok) throw await parseError(res)
  return res.json()
}

/**
 * GET /api/resumes/:id/analysis
 * Returns the cached analysis result.
 * @param {number} resumeId
 * @param {string} token
 * @returns {{ analysis }}
 */
export async function getAnalysis(resumeId, token) {
  const res = await fetch(`${BASE}/api/resumes/${resumeId}/analysis`, {
    headers: { Authorization: `Bearer ${token}` },
  })
  if (!res.ok) throw await parseError(res)
  return res.json()
}
