/**
 * services/resumeService.js
 * Business-logic for resume upload, form creation, editing, listing, deletion.
 */

import { randomUUID } from 'node:crypto'
import { extname } from 'node:path'
import * as resumeRepo from '../repositories/resumeRepository.js'
import { saveFile, deleteFile } from '../utils/storage.js'

const MAX_FILE_SIZE_BYTES = (parseInt(process.env.MAX_FILE_SIZE_MB ?? '5', 10)) * 1024 * 1024
const ALLOWED_MIME_TYPES  = new Set(['application/pdf'])

function resumeError(message, statusCode = 400) {
  const err = new Error(message)
  err.statusCode = statusCode
  return err
}

// ---------------------------------------------------------------------------

export async function upload({ userId, originalname, mimetype, size, buffer }) {
  if (!ALLOWED_MIME_TYPES.has(mimetype)) throw resumeError('Only PDF files are accepted', 415)
  if (size > MAX_FILE_SIZE_BYTES) throw resumeError(`File must be smaller than ${process.env.MAX_FILE_SIZE_MB ?? 5} MB`, 413)

  const ext        = extname(originalname).toLowerCase() || '.pdf'
  const storedName = `${randomUUID()}${ext}`

  await saveFile(buffer, storedName)

  try {
    return await resumeRepo.insertResume({
      userId, filename: originalname, storedName, fileSize: size, mimeType: mimetype,
      resumeType: 'pdf',
    })
  } catch (dbErr) {
    await deleteFile(storedName).catch(() => {})
    throw dbErr
  }
}

export async function createForm({ userId, filename, ...fields }) {
  return resumeRepo.insertResume({
    userId,
    filename: filename || fields.fullName || 'My Resume',
    storedName: '',
    fileSize: 0,
    mimeType: 'application/json',
    resumeType: 'form',
    ...fields,
  })
}

export async function updateForm({ id, userId, ...fields }) {
  const existing = await resumeRepo.findById(id)
  if (!existing)                   throw resumeError('Resume not found', 404)
  if (existing.user_id !== userId) throw resumeError('Forbidden', 403)

  return resumeRepo.updateResume({ id, userId, ...fields })
}

export async function listForUser(userId) {
  return resumeRepo.findByUserId(userId)
}

export async function getOne(id, userId) {
  const resume = await resumeRepo.findById(id)
  if (!resume)                    throw resumeError('Resume not found', 404)
  if (resume.user_id !== userId)  throw resumeError('Forbidden', 403)
  return resume
}

export async function remove(id, userId) {
  const resume = await resumeRepo.findById(id)
  if (!resume)                    throw resumeError('Resume not found', 404)
  if (resume.user_id !== userId)  throw resumeError('Forbidden', 403)

  if (resume.stored_name) {
    await deleteFile(resume.stored_name).catch(() => {})
  }
  await resumeRepo.deleteById(id)
}
