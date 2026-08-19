/**
 * utils/jwt.js
 * Thin wrappers around jsonwebtoken so the rest of the code
 * never imports jsonwebtoken directly.
 *
 * Requires env vars:
 *   JWT_SECRET      — long random string, keep secret
 *   JWT_EXPIRES_IN  — e.g. "7d", "24h"  (default: "7d")
 */

import jwt from 'jsonwebtoken'

function getSecret() {
  const secret = process.env.JWT_SECRET
  if (!secret) throw new Error('JWT_SECRET environment variable is not set')
  return secret
}

/**
 * Sign a payload and return a token string.
 * @param {object} payload  — plain object to embed (e.g. { userId, email })
 * @returns {string}        — signed JWT
 */
export function signToken(payload) {
  return jwt.sign(payload, getSecret(), {
    expiresIn: process.env.JWT_EXPIRES_IN ?? '7d',
  })
}

/**
 * Verify a token and return the decoded payload.
 * Throws JsonWebTokenError / TokenExpiredError on failure.
 * @param {string} token
 * @returns {object} decoded payload
 */
export function verifyToken(token) {
  return jwt.verify(token, getSecret())
}
