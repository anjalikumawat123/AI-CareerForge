/**
 * utils/storage.js
 * Local-disk file storage abstraction.
 *
 * Stores uploaded files under server/uploads/ (or the directory specified
 * by the UPLOAD_DIR env var, resolved relative to server/).
 *
 * Abstracted so a future IBM COS adapter can be swapped in without touching
 * the controller or service layers.
 *
 * Exports:
 *   uploadDir   — resolved absolute path to the storage directory
 *   saveFile(buffer, storedName)  → Promise<void>
 *   deleteFile(storedName)        → Promise<void>
 */

import { writeFile, unlink, mkdirSync } from 'node:fs'
import { promisify } from 'node:util'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const writeFileAsync  = promisify(writeFile)
const unlinkAsync     = promisify(unlink)

const __dirname = dirname(fileURLToPath(import.meta.url))

// Resolve the upload directory:
//   __dirname = server/src/utils/
//   ../..     = server/
//   + UPLOAD_DIR (default: uploads)
//   final     = server/uploads/
export const uploadDir = resolve(
  __dirname,
  '../..',
  process.env.UPLOAD_DIR ?? 'uploads'
)

// Ensure the upload directory exists when this module is first imported
mkdirSync(uploadDir, { recursive: true })

/**
 * Persist a file buffer to the upload directory.
 * @param {Buffer} buffer       — raw file bytes
 * @param {string} storedName   — filename to save as (UUID-based, no path separators)
 * @returns {Promise<void>}
 */
export async function saveFile(buffer, storedName) {
  const dest = resolve(uploadDir, storedName)
  await writeFileAsync(dest, buffer)
}

/**
 * Remove a stored file from the upload directory.
 * Silently ignores ENOENT (file already gone).
 * @param {string} storedName
 * @returns {Promise<void>}
 */
export async function deleteFile(storedName) {
  const target = resolve(uploadDir, storedName)
  try {
    await unlinkAsync(target)
  } catch (err) {
    if (err.code !== 'ENOENT') throw err
  }
}
