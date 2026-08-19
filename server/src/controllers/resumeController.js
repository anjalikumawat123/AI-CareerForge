/**
 * controllers/resumeController.js
 */

import * as resumeService from '../services/resumeService.js'

function handleError(err, res) {
  const status  = err.statusCode ?? 500
  const message = status === 500 ? 'Internal server error' : err.message
  if (status === 500) console.error('[resumeController]', err)
  return res.status(status).json({ error: message })
}

export async function uploadHandler(req, res) {
  try {
    if (!req.file) return res.status(400).json({ error: 'No file provided' })
    const resume = await resumeService.upload({
      userId:       req.user.userId,
      originalname: req.file.originalname,
      mimetype:     req.file.mimetype,
      size:         req.file.size,
      buffer:       req.file.buffer,
    })
    return res.status(201).json({ message: 'Resume uploaded successfully', resume })
  } catch (err) { return handleError(err, res) }
}

export async function createFormHandler(req, res) {
  try {
    const resume = await resumeService.createForm({ userId: req.user.userId, ...req.body })
    return res.status(201).json({ message: 'Resume created successfully', resume })
  } catch (err) { return handleError(err, res) }
}

export async function updateFormHandler(req, res) {
  try {
    const id     = parseInt(req.params.id, 10)
    const resume = await resumeService.updateForm({ id, userId: req.user.userId, ...req.body })
    return res.json({ message: 'Resume updated successfully', resume })
  } catch (err) { return handleError(err, res) }
}

export async function listHandler(req, res) {
  try {
    const resumes = await resumeService.listForUser(req.user.userId)
    return res.json({ resumes })
  } catch (err) { return handleError(err, res) }
}

export async function getOneHandler(req, res) {
  try {
    const id     = parseInt(req.params.id, 10)
    const resume = await resumeService.getOne(id, req.user.userId)
    return res.json({ resume })
  } catch (err) { return handleError(err, res) }
}

export async function deleteHandler(req, res) {
  try {
    const id = parseInt(req.params.id, 10)
    await resumeService.remove(id, req.user.userId)
    return res.json({ message: 'Resume deleted successfully' })
  } catch (err) { return handleError(err, res) }
}
