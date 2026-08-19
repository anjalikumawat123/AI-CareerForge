/**
 * api/jobMatch.js
 */

const BASE = import.meta.env.VITE_API_URL ?? ''

async function parseError(res) {
  const body = await res.json().catch(() => ({}))
  const message = body.error ?? `Request failed (${res.status})`
  const err = new Error(message); err.status = res.status; return err
}

export async function matchJob(data, token) {
  const res = await fetch(`${BASE}/api/job-match`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })
  if (!res.ok) throw await parseError(res)
  return res.json()
}

export async function getMatches(token) {
  const res = await fetch(`${BASE}/api/job-match`, {
    headers: { Authorization: `Bearer ${token}` },
  })
  if (!res.ok) throw await parseError(res)
  return res.json()
}
