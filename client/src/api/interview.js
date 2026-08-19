/**
 * api/interview.js
 */

const BASE = import.meta.env.VITE_API_URL ?? ''

async function parseError(res) {
  const body = await res.json().catch(() => ({}))
  const message = body.error ?? `Request failed (${res.status})`
  const err = new Error(message); err.status = res.status; return err
}

export async function createSession(data, token) {
  const res = await fetch(`${BASE}/api/interviews`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })
  if (!res.ok) throw await parseError(res)
  return res.json()
}

export async function getSessions(token) {
  const res = await fetch(`${BASE}/api/interviews`, {
    headers: { Authorization: `Bearer ${token}` },
  })
  if (!res.ok) throw await parseError(res)
  return res.json()
}

export async function getSession(id, token) {
  const res = await fetch(`${BASE}/api/interviews/${id}`, {
    headers: { Authorization: `Bearer ${token}` },
  })
  if (!res.ok) throw await parseError(res)
  return res.json()
}

export async function submitAnswer(id, data, token) {
  const res = await fetch(`${BASE}/api/interviews/${id}/answer`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })
  if (!res.ok) throw await parseError(res)
  return res.json()
}

export async function completeSession(id, token) {
  const res = await fetch(`${BASE}/api/interviews/${id}/complete`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
  })
  if (!res.ok) throw await parseError(res)
  return res.json()
}

export async function deleteSession(id, token) {
  const res = await fetch(`${BASE}/api/interviews/${id}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` },
  })
  if (!res.ok) throw await parseError(res)
  return res.json()
}
