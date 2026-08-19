/**
 * routes/analytics.js
 */

import { Router } from 'express'
import requireAuth from '../middleware/requireAuth.js'
import { getAnalyticsHandler } from '../controllers/analyticsController.js'

const router = Router()
router.use(requireAuth)
router.get('/', getAnalyticsHandler)

export default router
