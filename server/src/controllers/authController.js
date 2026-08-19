/**
 * controllers/authController.js
 * HTTP layer — parses request, calls authService, sends response.
 * No business logic lives here.
 */

import * as authService from '../services/authService.js'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Forward a service-thrown error as an HTTP response. */
function handleServiceError(err, res) {
  const status = err.statusCode ?? 500
  // Only mask truly unexpected errors (500); expose 503 DB-pending messages in dev
  const message = status === 500 ? 'Internal server error' : err.message

  if (status === 500) console.error('[authController]', err)

  return res.status(status).json({ error: message })
}

// ---------------------------------------------------------------------------
// POST /api/auth/register
// ---------------------------------------------------------------------------
export async function registerHandler(req, res) {
  try {
    const { name, email, password } = req.body
    const { user, token } = await authService.register({ name, email, password })

    return res.status(201).json({
      message: 'Account created successfully',
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
      },
    })
  } catch (err) {
    return handleServiceError(err, res)
  }
}

// ---------------------------------------------------------------------------
// POST /api/auth/login
// ---------------------------------------------------------------------------
export async function loginHandler(req, res) {
  try {
    const { email, password } = req.body
    const { user, token } = await authService.login({ email, password })

    return res.json({
      message: 'Logged in successfully',
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
      },
    })
  } catch (err) {
    return handleServiceError(err, res)
  }
}

// ---------------------------------------------------------------------------
// GET /api/auth/me  (protected)
// ---------------------------------------------------------------------------
export async function getMeHandler(req, res) {
  try {
    // req.user is set by requireAuth middleware
    const user = await authService.getMe(req.user.userId)

    return res.json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
      },
    })
  } catch (err) {
    return handleServiceError(err, res)
  }
}

// ---------------------------------------------------------------------------
// POST /api/auth/logout
// ---------------------------------------------------------------------------
export function logoutHandler(_req, res) {
  // JWTs are stateless — the client deletes the token.
  // When we add a token-blocklist / refresh-token table in a later stage,
  // that invalidation logic will go here.
  return res.json({ message: 'Logged out successfully' })
}
