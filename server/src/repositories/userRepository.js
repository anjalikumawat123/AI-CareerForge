/**
 * repositories/userRepository.js
 * Data-access layer for the users table.
 *
 * Uses better-sqlite3 (synchronous API).
 * better-sqlite3 statements are synchronous — we still export async
 * functions to keep the interface identical to what authService expects,
 * making a future swap to PostgreSQL a drop-in replacement.
 *
 * Contract:
 *   findByEmail(email)                              → Promise<User | null>
 *   findById(id)                                    → Promise<User | null>
 *   createUser({ name, email, passwordHash })       → Promise<User>
 *
 * User shape returned to callers (password_hash is NEVER returned):
 *   { id, name, email, created_at, updated_at }
 */

import db from '../db/database.js'

// ---------------------------------------------------------------------------
// Prepared statements — compiled once at startup, reused on every call
// ---------------------------------------------------------------------------

const stmtFindByEmail = db.prepare(
  'SELECT * FROM users WHERE email = ? LIMIT 1'
)

const stmtFindById = db.prepare(
  'SELECT * FROM users WHERE id = ? LIMIT 1'
)

const stmtInsert = db.prepare(`
  INSERT INTO users (name, email, password_hash, created_at, updated_at)
  VALUES (@name, @email, @passwordHash, @createdAt, @updatedAt)
`)

// ---------------------------------------------------------------------------
// Helper — strip password_hash before returning to the caller
// ---------------------------------------------------------------------------

function safeUser(row) {
  if (!row) return null
  const { password_hash, ...safe } = row   // eslint-disable-line no-unused-vars
  return safe
}

// ---------------------------------------------------------------------------
// Repository methods
// ---------------------------------------------------------------------------

/**
 * Find a user row by email.
 * Returns the FULL row (including password_hash) so authService can
 * compare the password. The controller/service must never forward this
 * raw row to the HTTP response.
 *
 * @param {string} email
 * @returns {Promise<object | null>}
 */
export async function findByEmail(email) {
  const row = stmtFindByEmail.get(email)
  return row ?? null
}

/**
 * Find a user by primary key.
 * Returns safe user (no password_hash).
 *
 * @param {number|string} id
 * @returns {Promise<object | null>}
 */
export async function findById(id) {
  const row = stmtFindById.get(id)
  return safeUser(row)
}

/**
 * Insert a new user row.
 * Returns safe user (no password_hash).
 *
 * @param {{ name: string, email: string, passwordHash: string }} data
 * @returns {Promise<object>}
 */
export async function createUser({ name, email, passwordHash }) {
  const now = new Date().toISOString()

  const result = stmtInsert.run({
    name,
    email,
    passwordHash,
    createdAt: now,
    updatedAt: now,
  })

  // Fetch the newly-inserted row by its auto-generated id
  const row = stmtFindById.get(result.lastInsertRowid)
  return safeUser(row)
}
