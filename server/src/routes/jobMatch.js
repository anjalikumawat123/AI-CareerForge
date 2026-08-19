/**
 * routes/jobMatch.js
 */

import { Router } from 'express'
import requireAuth from '../middleware/requireAuth.js'
import { matchHandler, listMatchesHandler } from '../controllers/jobMatchController.js'

const router = Router()
router.use(requireAuth)

router.post('/', matchHandler)
router.get('/', listMatchesHandler)

export default router
