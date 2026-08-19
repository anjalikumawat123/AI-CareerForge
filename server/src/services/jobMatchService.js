/**
 * services/jobMatchService.js
 * Local text-based job description matching engine.
 */

import * as resumeRepo    from '../repositories/resumeRepository.js'
import * as jobMatchRepo  from '../repositories/jobMatchRepository.js'
import { localAnalyse }   from '../utils/aiProvider.js'

function matchError(msg, code = 400) {
  const e = new Error(msg); e.statusCode = code; return e
}

// Common tech terms for keyword extraction
const TECH_TERMS = [
  'javascript','typescript','python','java','c++','c#','go','rust','ruby','php','swift','kotlin',
  'react','vue','angular','node','express','django','flask','spring','sql','postgresql','mysql',
  'mongodb','redis','aws','azure','gcp','docker','kubernetes','git','linux','bash','rest',
  'graphql','microservices','ci/cd','machine learning','tensorflow','pytorch','pandas','html','css',
  'tailwind','agile','scrum','jira','api','backend','frontend','fullstack','devops','cloud',
  'testing','jest','mocha','cypress','selenium','database','authentication','security',
]

function extractKeywords(text) {
  const lower = text.toLowerCase()
  const found = TECH_TERMS.filter(t => lower.includes(t))
  // Also extract capitalised words (likely tech terms)
  const caps = (text.match(/\b[A-Z][a-zA-Z0-9.+#]{2,}\b/g) || [])
    .filter(w => w.length < 20)
    .map(w => w.toLowerCase())
  return [...new Set([...found, ...caps])]
}

function resumeToText(resume) {
  const parts = [
    resume.full_name, resume.summary,
    ...(resume.skills        || []).map(s => typeof s === 'string' ? s : s.name),
    ...(resume.experience    || []).map(e => `${e.title} ${e.company} ${e.description}`),
    ...(resume.projects      || []).map(p => `${p.name} ${p.description} ${p.technologies}`),
    ...(resume.education     || []).map(e => `${e.degree} ${e.institution}`),
    ...(resume.certifications|| []).map(c => typeof c === 'string' ? c : c.name),
    ...(resume.achievements  || []).map(a => typeof a === 'string' ? a : a.description),
  ]
  return parts.filter(Boolean).join(' ')
}

export async function matchJob({ resumeId, userId, jobTitle, jobDescription }) {
  const resume = await resumeRepo.findById(resumeId)
  if (!resume)                    throw matchError('Resume not found', 404)
  if (resume.user_id !== userId)  throw matchError('Forbidden', 403)

  const resumeText = resumeToText(resume)
  const jdLower    = jobDescription.toLowerCase()
  const resumeLow  = resumeText.toLowerCase()

  const jdKeywords    = extractKeywords(jobDescription)
  const resumeKeywords= extractKeywords(resumeText)

  const matchingKeywords = jdKeywords.filter(k => resumeLow.includes(k))
  const missingKeywords  = jdKeywords.filter(k => !resumeLow.includes(k))

  // Skill matching
  const resumeSkills = (resume.skills || []).map(s =>
    (typeof s === 'string' ? s : s.name || '').toLowerCase()
  )
  const jdSkillsFound = TECH_TERMS.filter(t => jdLower.includes(t))
  const matchingSkills = jdSkillsFound.filter(s => resumeLow.includes(s))
  const missingSkills  = jdSkillsFound.filter(s => !resumeLow.includes(s))

  const matchScore = jdKeywords.length > 0
    ? Math.round((matchingKeywords.length / jdKeywords.length) * 100)
    : 0

  const suggestions = []
  if (missingSkills.length)   suggestions.push(`Add missing skills: ${missingSkills.slice(0,5).join(', ')}`)
  if (missingKeywords.length) suggestions.push(`Use these keywords from the job description: ${missingKeywords.slice(0,5).join(', ')}`)
  suggestions.push('Rewrite your summary to reflect the job title and key requirements')
  suggestions.push('Quantify your impact using numbers and metrics that align with the role')
  if (matchScore < 50)        suggestions.push('Your resume needs significant tailoring for this role')
  else if (matchScore < 75)   suggestions.push('Good overlap — a few targeted changes will improve your match significantly')
  else                        suggestions.push('Strong match! Highlight your most relevant experience first')

  const saved = await jobMatchRepo.saveMatch({
    resumeId, userId, jobTitle, jobDescription,
    matchScore,
    matchingSkills:   matchingSkills.map(s => s.charAt(0).toUpperCase() + s.slice(1)),
    missingSkills:    missingSkills.map(s => s.charAt(0).toUpperCase() + s.slice(1)),
    matchingKeywords: matchingKeywords.map(k => k.charAt(0).toUpperCase() + k.slice(1)),
    missingKeywords:  missingKeywords.map(k => k.charAt(0).toUpperCase() + k.slice(1)),
    suggestions,
  })

  return saved
}

export async function getMatches(userId) {
  return jobMatchRepo.findByUser(userId)
}
