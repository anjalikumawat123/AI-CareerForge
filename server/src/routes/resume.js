/**
 * routes/resume.js
 */

import { Router } from 'express'
import multer from 'multer'
import requireAuth from '../middleware/requireAuth.js'
import uploadMiddleware from '../middleware/upload.js'
import {
  uploadHandler,
  createFormHandler,
  updateFormHandler,
  listHandler,
  getOneHandler,
  deleteHandler,
} from '../controllers/resumeController.js'
import {
  analyseHandler,
  getAnalysisHandler,
} from '../controllers/analysisController.js'

const router = Router()
router.use(requireAuth)

// PDF upload
router.post('/upload', (req, res, next) => {
  uploadMiddleware(req, res, (err) => {
    if (err instanceof multer.MulterError) {
      const status = err.code === 'LIMIT_FILE_SIZE' ? 413 : 400
      return res.status(status).json({ error: err.message })
    }
    if (err) return res.status(400).json({ error: err.message ?? 'File upload error' })
    next()
  })
}, uploadHandler)

// POST / — detect if multipart (file upload) or JSON (form creation)
router.post('/', (req, res, next) => {
  const ct = req.headers['content-type'] || ''
  if (ct.includes('multipart/form-data')) {
    // PDF upload path
    uploadMiddleware(req, res, (err) => {
      if (err instanceof multer.MulterError) {
        const status = err.code === 'LIMIT_FILE_SIZE' ? 413 : 400
        return res.status(status).json({ error: err.message })
      }
      if (err) return res.status(400).json({ error: err.message ?? 'File upload error' })
      return uploadHandler(req, res, next)
    })
  } else {
    // JSON form creation path
    return createFormHandler(req, res, next)
  }
})

// Form-based CRUD
router.post('/form', createFormHandler)
router.get('/', listHandler)
router.get('/:id', getOneHandler)
router.put('/:id', updateFormHandler)
router.delete('/:id', deleteHandler)

// Analysis
router.post('/:id/analyse', analyseHandler)
router.get('/:id/analysis', getAnalysisHandler)

export default router
