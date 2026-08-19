/**
 * services/authService.js
 * Business-logic layer for authentication.
 * Orchestrates the repository, hashing, and JWT utilities.
 * Controllers call this; this calls repositories.
 *
 * Throws plain Error objects with a `statusCode` property so
 * the controller can forward the right HTTP status.
 */

import { hashPassword, comparePassword } from '../utils/hash.js'
import { signToken } from '../utils/jwt.js'
import * as userRepo from '../repositories/userRepository.js'

// ---------------------------------------------------------------------------
// Helper
// ---------------------------------------------------------------------------

function authError(message, statusCode = 400) {
  const err = new Error(message)
  err.statusCode = statusCode
  return err
}

// ---------------------------------------------------------------------------
// Service methods
// ---------------------------------------------------------------------------

/**
 * Register a new user.
 * @param {{ name, email, password }} data
 * @returns {{ user, token }}
 */
export async function register({ name, email, password }) {
  // 1. Check if email is already taken
  const existing = await userRepo.findByEmail(email)
  if (existing) {
    throw authError('An account with that email already exists', 409)
  }

  // 2. Hash the password — NEVER store plain text
  const passwordHash = await hashPassword(password)

  // 3. Persist the new user
  const user = await userRepo.createUser({ name, email, passwordHash })

  // 4. Issue a JWT
  const token = signToken({ userId: user.id, email: user.email })

  return { user, token }
}

/**
 * Log in an existing user.
 * @param {{ email, password }} data
 * @returns {{ user, token }}
 */
export async function login({ email, password }) {
  // 1. Look up user — returns full row including password_hash
  const user = await userRepo.findByEmail(email)
  if (!user) {
    // Same message as wrong-password to prevent user enumeration
    throw authError('Invalid email or password', 401)
  }

  // 2. Verify password
  const valid = await comparePassword(password, user.password_hash)
  if (!valid) {
    throw authError('Invalid email or password', 401)
  }

  // 3. Issue a JWT
  const token = signToken({ userId: user.id, email: user.email })

  // 4. Return safe user (strip password_hash)
  const { password_hash, ...safeUser } = user  // eslint-disable-line no-unused-vars
  return { user: safeUser, token }
}

/**
 * Return the profile of the currently authenticated user.
 * @param {number|string} userId  — from the verified JWT payload
 * @returns {object} user (without password_hash)
 */
export async function getMe(userId) {
  const user = await userRepo.findById(userId)
  if (!user) {
    throw authError('User not found', 404)
  }
  return user
}
