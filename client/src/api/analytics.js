/**
 * api/analytics.js
 */

const BASE = import.meta.env.VITE_API_URL ?? ''

async function parseError(res) {
  const body = await res.json().catch(() => ({}))
  const message = body.error ?? `Request failed (${res.status})`
  const err = new Error(message); err.status = res.status; return err
}

export async function getAnalytics(token) {
  const res = await fetch(`${BASE}/api/analytics`, {
    headers: { Authorization: `Bearer ${token}` },
  })
  if (!res.ok) throw await parseError(res)
  return res.json()
}
