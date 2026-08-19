/**
 * api.js — central place for all fetch calls to the backend.
 * VITE_API_URL is read from the environment.
 * During development the Vite proxy rewrites /api/* → http://localhost:5000/api/*
 * so this can be left empty.
 */
const BASE_URL = import.meta.env.VITE_API_URL ?? ''

export async function getHealthStatus() {
  const response = await fetch(`${BASE_URL}/api/health`)
  if (!response.ok) throw new Error(`Health check failed: ${response.status}`)
  return response.json()
}
