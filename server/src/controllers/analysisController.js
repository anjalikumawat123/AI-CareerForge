/**
 * controllers/analysisController.js
 * HTTP layer for resume analysis endpoints.
 * No business logic lives here.
 */

import * as analysisService from '../services/analysisService.js'

function handleError(err, res) {
  const status  = err.statusCode ?? 500
  const message = status === 500 ? 'Internal server error' : err.message
  if (status === 500) console.error('[analysisController]', err)
  return res.status(status).json({ error: message })
}

// ---------------------------------------------------------------------------
// POST /api/resumes/:id/analyse
// Triggers (or re-triggers) analysis of the specified resume.
// ---------------------------------------------------------------------------
export async function analyseHandler(req, res) {
  try {
    const resumeId = parseInt(req.params.id, 10)
    const analysis = await analysisService.analyse(resumeId, req.user.userId)
    return res.status(201).json({ message: 'Analysis complete', analysis })
  } catch (err) {
    return handleError(err, res)
  }
}

// ---------------------------------------------------------------------------
// GET /api/resumes/:id/analysis
// Returns the cached analysis result (null body if not yet analysed).
// ---------------------------------------------------------------------------
export async function getAnalysisHandler(req, res) {
  try {
    const resumeId = parseInt(req.params.id, 10)
    const analysis = await analysisService.getAnalysis(resumeId, req.user.userId)
    if (!analysis) {
      return res.status(404).json({ error: 'No analysis found for this resume. Run analysis first.' })
    }
    return res.json({ analysis })
  } catch (err) {
    return handleError(err, res)
  }
}
