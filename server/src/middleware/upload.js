/**
 * middleware/upload.js
 * Multer configuration for resume file uploads.
 *
 * Uses memoryStorage so the buffer is available for validation
 * before we write to disk via the storage utility.
 *
 * Limits:
 *   - fileSize: MAX_FILE_SIZE_MB (default 5 MB) — a hard upper bound
 *     before the request is even handed to the controller.
 *   - files: 1 — single-file upload only
 *
 * Usage:
 *   import uploadMiddleware from '../middleware/upload.js'
 *   router.post('/', requireAuth, uploadMiddleware, handler)
 */

import multer from 'multer'

const MAX_BYTES = (parseInt(process.env.MAX_FILE_SIZE_MB ?? '5', 10)) * 1024 * 1024

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: MAX_BYTES,
    files:    1,
  },
  fileFilter(_req, file, cb) {
    // Pre-filter by MIME type — the service layer does a second check
    if (file.mimetype === 'application/pdf') {
      cb(null, true)
    } else {
      // Passing an error here causes multer to reject the file
      cb(new multer.MulterError('LIMIT_UNEXPECTED_FILE', 'Only PDF files are accepted'))
    }
  },
})

// Export a single-file middleware keyed on the field name "resume"
export default upload.single('resume')
