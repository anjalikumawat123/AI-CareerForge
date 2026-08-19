/**
 * api/auth.js
 * All fetch calls related to authentication.
 * Reads VITE_API_URL from env; falls back to '' (Vite proxy handles it).
 */

const BASE = import.meta.env.VITE_API_URL ?? ''

/** Helper — throws a structured error from a non-ok response */
async function parseError(res) {
  const body = await res.json().catch(() => ({}))
  const message =
    body.error ??
    (Array.isArray(body.errors) ? body.errors[0] : null) ??
    `Request failed (${res.status})`
  const err = new Error(message)
  err.status = res.status
  err.errors = body.errors ?? null
  return err
}

// ---------------------------------------------------------------------------

/**
 * POST /api/auth/register
 * @param {{ name, email, password }} data
 * @returns {{ token, user }}
 */
export async function register(data) {
  const res = await fetch(`${BASE}/api/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })
  if (!res.ok) throw await parseError(res)
  return res.json()
}

/**
 * POST /api/auth/login
 * @param {{ email, password }} data
 * @returns {{ token, user }}
 */
export async function loginRequest(data) {
  const res = await fetch(`${BASE}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })
  if (!res.ok) throw await parseError(res)
  return res.json()
}

/**
 * GET /api/auth/me
 * @param {string} token — JWT
 * @returns {{ user }}
 */
export async function getMe(token) {
  const res = await fetch(`${BASE}/api/auth/me`, {
    headers: { Authorization: `Bearer ${token}` },
  })
  if (!res.ok) throw await parseError(res)
  return res.json()
}

/**
 * POST /api/auth/logout
 * @param {string} token — JWT
 */
export async function logoutRequest(token) {
  await fetch(`${BASE}/api/auth/logout`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
  })
}
