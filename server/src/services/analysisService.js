/**
 * services/analysisService.js
 */

import * as resumeRepo   from '../repositories/resumeRepository.js'
import * as analysisRepo from '../repositories/analysisRepository.js'
import { extractTextFromFile } from '../utils/pdfExtract.js'
import { analyseResume } from '../utils/aiProvider.js'

function analysisError(message, statusCode = 400) {
  const err = new Error(message)
  err.statusCode = statusCode
  return err
}

function resumeToText(resume) {
  // Build a text representation from structured resume data
  const parts = []
  if (resume.full_name)  parts.push(resume.full_name)
  if (resume.email)      parts.push(resume.email)
  if (resume.phone)      parts.push(resume.phone)
  if (resume.linkedin)   parts.push('LinkedIn: ' + resume.linkedin)
  if (resume.github)     parts.push('GitHub: ' + resume.github)
  if (resume.summary)    parts.push(resume.summary)

  const skills = resume.skills || []
  if (skills.length) parts.push('Skills: ' + skills.join(', '))

  const exp = resume.experience || []
  for (const e of exp) {
    parts.push(`${e.title || ''} at ${e.company || ''} ${e.duration || ''} ${e.description || ''}`)
  }

  const edu = resume.education || []
  for (const e of edu) {
    parts.push(`${e.degree || ''} ${e.institution || ''} ${e.year || ''} GPA: ${e.gpa || ''}`)
  }

  const proj = resume.projects || []
  for (const p of proj) {
    parts.push(`Project: ${p.name || ''} ${p.description || ''} Technologies: ${p.technologies || ''}`)
  }

  const certs = resume.certifications || []
  if (certs.length) parts.push('Certifications: ' + certs.join(', '))

  const ach = resume.achievements || []
  if (ach.length) parts.push('Achievements: ' + ach.join(', '))

  return parts.filter(Boolean).join('\n')
}

export async function analyse(resumeId, userId) {
  const resume = await resumeRepo.findById(resumeId)
  if (!resume)                    throw analysisError('Resume not found', 404)
  if (resume.user_id !== userId)  throw analysisError('Forbidden', 403)

  let text
  if (resume.resume_type === 'form' || !resume.stored_name) {
    // Use structured data for analysis
    text = resumeToText(resume)
    if (!text || text.length < 10) {
      throw analysisError('Resume has no content to analyse. Please fill in your resume details.', 422)
    }
  } else {
    // Extract text from PDF
    try {
      text = await extractTextFromFile(resume.stored_name)
    } catch (err) {
      throw analysisError(`Could not read PDF file: ${err.message}`, 422)
    }
    if (!text || text.length < 50) {
      throw analysisError('The PDF appears to be empty or image-only. Please upload a text-based PDF.', 422)
    }
  }

  const result = await analyseResume(text)

  const saved = await analysisRepo.upsertAnalysis({
    resumeId, userId, ...result,
  })

  return saved
}

export async function getAnalysis(resumeId, userId) {
  const resume = await resumeRepo.findById(resumeId)
  if (!resume)                    throw analysisError('Resume not found', 404)
  if (resume.user_id !== userId)  throw analysisError('Forbidden', 403)

  return analysisRepo.findByResumeId(resumeId)
}
