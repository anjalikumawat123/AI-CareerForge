/**
 * api/resume.js — resume API calls
 */

const BASE = import.meta.env.VITE_API_URL ?? ''

async function parseError(res) {
  const body = await res.json().catch(() => ({}))
  const message = body.error ?? (Array.isArray(body.errors) ? body.errors[0] : null) ?? `Request failed (${res.status})`
  const err = new Error(message)
  err.status = res.status
  return err
}

export async function uploadResume(file, token) {
  const form = new FormData()
  form.append('resume', file)
  const res = await fetch(`${BASE}/api/resumes`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: form,
  })
  if (!res.ok) throw await parseError(res)
  return res.json()
}

export async function createResume(data, token) {
  const res = await fetch(`${BASE}/api/resumes/form`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })
  if (!res.ok) throw await parseError(res)
  return res.json()
}

export async function updateResume(id, data, token) {
  const res = await fetch(`${BASE}/api/resumes/${id}`, {
    method: 'PUT',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })
  if (!res.ok) throw await parseError(res)
  return res.json()
}

export async function listResumes(token) {
  const res = await fetch(`${BASE}/api/resumes`, {
    headers: { Authorization: `Bearer ${token}` },
  })
  if (!res.ok) throw await parseError(res)
  return res.json()
}

export async function getResume(id, token) {
  const res = await fetch(`${BASE}/api/resumes/${id}`, {
    headers: { Authorization: `Bearer ${token}` },
  })
  if (!res.ok) throw await parseError(res)
  return res.json()
}

export async function deleteResume(id, token) {
  const res = await fetch(`${BASE}/api/resumes/${id}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` },
  })
  if (!res.ok) throw await parseError(res)
  return res.json()
}
