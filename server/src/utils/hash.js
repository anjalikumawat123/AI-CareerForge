/**
 * utils/hash.js
 * Thin wrappers around bcryptjs so the rest of the code
 * never imports bcryptjs directly.
 */

import bcrypt from 'bcryptjs'

const SALT_ROUNDS = 12

/**
 * Hash a plain-text password.
 * @param {string} plainText
 * @returns {Promise<string>} bcrypt hash
 */
export async function hashPassword(plainText) {
  return bcrypt.hash(plainText, SALT_ROUNDS)
}

/**
 * Compare a plain-text password against a stored hash.
 * @param {string} plainText
 * @param {string} hash
 * @returns {Promise<boolean>}
 */
export async function comparePassword(plainText, hash) {
  return bcrypt.compare(plainText, hash)
}
