/**
 * controllers/interviewController.js
 */

import * as interviewService from '../services/interviewService.js'

function handleError(err, res) {
  const status  = err.statusCode ?? 500
  const message = status === 500 ? 'Internal server error' : err.message
  if (status === 500) console.error('[interviewController]', err)
  return res.status(status).json({ error: message })
}

export async function createSessionHandler(req, res) {
  try {
    const { jobRole, experienceLevel, interviewType } = req.body
    if (!jobRole || !experienceLevel || !interviewType) {
      return res.status(400).json({ error: 'jobRole, experienceLevel, and interviewType are required' })
    }
    const result = await interviewService.createSession({
      userId: req.user.userId, jobRole, experienceLevel, interviewType,
    })
    return res.status(201).json(result)
  } catch (err) { return handleError(err, res) }
}

export async function listSessionsHandler(req, res) {
  try {
    const sessions = await interviewService.getSessions(req.user.userId)
    return res.json({ sessions })
  } catch (err) { return handleError(err, res) }
}

export async function getSessionHandler(req, res) {
  try {
    const id = parseInt(req.params.id, 10)
    const result = await interviewService.getSession(id, req.user.userId)
    return res.json(result)
  } catch (err) { return handleError(err, res) }
}

export async function submitAnswerHandler(req, res) {
  try {
    const sessionId = parseInt(req.params.id, 10)
    const { questionIndex, question, questionType, answer } = req.body
    if (answer === undefined || answer === null) {
      return res.status(400).json({ error: 'answer is required' })
    }
    const result = await interviewService.submitAnswer({
      sessionId,
      userId: req.user.userId,
      questionIndex: questionIndex ?? 0,
      question:      question ?? '',
      questionType:  questionType ?? 'general',
      answer,
    })
    return res.json(result)
  } catch (err) { return handleError(err, res) }
}

export async function completeSessionHandler(req, res) {
  try {
    const id = parseInt(req.params.id, 10)
    const result = await interviewService.completeSession(id, req.user.userId)
    return res.json(result)
  } catch (err) { return handleError(err, res) }
}

export async function deleteSessionHandler(req, res) {
  try {
    const id = parseInt(req.params.id, 10)
    await interviewService.deleteSession(id, req.user.userId)
    return res.json({ message: 'Interview session deleted' })
  } catch (err) { return handleError(err, res) }
}
