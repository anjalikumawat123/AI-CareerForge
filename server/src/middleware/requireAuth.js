/**
 * middleware/requireAuth.js
 * Protects routes that require a signed-in user.
 *
 * Reads the Bearer token from the Authorization header,
 * verifies it, and attaches the decoded payload to req.user.
 *
 * Usage:
 *   import requireAuth from '../middleware/requireAuth.js'
 *   router.get('/me', requireAuth, handler)
 */

import { verifyToken } from '../utils/jwt.js'

export default function requireAuth(req, res, next) {
  const authHeader = req.headers['authorization']

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Authentication required' })
  }

  const token = authHeader.slice(7) // strip "Bearer "

  try {
    req.user = verifyToken(token)
    next()
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Session expired, please log in again' })
    }
    return res.status(401).json({ error: 'Invalid token' })
  }
}
