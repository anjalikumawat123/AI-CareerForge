/**
 * routes/interview.js
 */

import { Router } from 'express'
import requireAuth from '../middleware/requireAuth.js'
import {
  createSessionHandler,
  listSessionsHandler,
  getSessionHandler,
  submitAnswerHandler,
  completeSessionHandler,
  deleteSessionHandler,
} from '../controllers/interviewController.js'

const router = Router()
router.use(requireAuth)

router.post('/',              createSessionHandler)
router.get('/',               listSessionsHandler)
router.get('/:id',            getSessionHandler)
router.post('/:id/answer',    submitAnswerHandler)
router.post('/:id/complete',  completeSessionHandler)
router.delete('/:id',         deleteSessionHandler)

export default router
