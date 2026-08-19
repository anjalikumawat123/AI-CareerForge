/**
 * routes/auth.js
 * Mounts all /api/auth/* endpoints.
 */

import { Router } from 'express'
import {
  registerHandler,
  loginHandler,
  getMeHandler,
  logoutHandler,
} from '../controllers/authController.js'
import requireAuth from '../middleware/requireAuth.js'
import { validate, registerSchema, loginSchema } from '../middleware/validate.js'

const router = Router()

// POST /api/auth/register
router.post('/register', validate(registerSchema), registerHandler)

// POST /api/auth/login
router.post('/login', validate(loginSchema), loginHandler)

// GET /api/auth/me  — requires valid JWT
router.get('/me', requireAuth, getMeHandler)

// POST /api/auth/logout
router.post('/logout', requireAuth, logoutHandler)

export default router
