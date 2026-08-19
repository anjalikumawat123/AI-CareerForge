/**
 * routes/health.js
 * Health-check endpoint.
 * GET /api/health  →  { status, message, timestamp, environment }
 */

import { Router } from 'express'

const router = Router()

router.get('/health', (_req, res) => {
  res.json({
    status: 'ok',
    message: 'AI CareerForge API is running',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV ?? 'development',
  })
})

export default router
