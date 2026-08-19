/**
 * controllers/jobMatchController.js
 */

import * as jobMatchService from '../services/jobMatchService.js'

function handleError(err, res) {
  const status  = err.statusCode ?? 500
  const message = status === 500 ? 'Internal server error' : err.message
  if (status === 500) console.error('[jobMatchController]', err)
  return res.status(status).json({ error: message })
}

export async function matchHandler(req, res) {
  try {
    const { resumeId, jobTitle, jobDescription } = req.body
    if (!resumeId || !jobDescription) {
      return res.status(400).json({ error: 'resumeId and jobDescription are required' })
    }
    const result = await jobMatchService.matchJob({
      resumeId:       parseInt(resumeId, 10),
      userId:         req.user.userId,
      jobTitle:       jobTitle ?? '',
      jobDescription,
    })
    return res.status(201).json({ match: result })
  } catch (err) { return handleError(err, res) }
}

export async function listMatchesHandler(req, res) {
  try {
    const matches = await jobMatchService.getMatches(req.user.userId)
    return res.json({ matches })
  } catch (err) { return handleError(err, res) }
}
