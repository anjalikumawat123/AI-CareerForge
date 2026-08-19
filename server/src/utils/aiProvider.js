/**
 * utils/aiProvider.js
 * Local rule-based resume analysis engine.
 * Architecture allows an AI provider (watsonx) to be swapped in later.
 */

const _hasKey     = !!process.env.WATSONX_API_KEY
const _hasProject = !!process.env.WATSONX_PROJECT_ID
const _hasUrl     = !!process.env.WATSONX_URL

if (_hasKey && _hasProject && _hasUrl) {
  console.log('[aiProvider] IBM watsonx.ai credentials detected — AI provider: watsonx')
} else {
  console.log('[aiProvider] Using built-in local analysis engine.')
}

// ---------------------------------------------------------------------------
// Skill / keyword dictionaries
// ---------------------------------------------------------------------------

const TECH_SKILLS = [
  'javascript','typescript','python','java','c++','c#','go','rust','ruby','php','swift','kotlin',
  'react','vue','angular','svelte','nextjs','nuxt','node','express','fastapi','django','flask',
  'spring','laravel','rails',
  'sql','postgresql','mysql','sqlite','mongodb','redis','elasticsearch','dynamodb',
  'aws','azure','gcp','docker','kubernetes','terraform','ansible','jenkins','github actions',
  'git','linux','bash','rest','graphql','grpc','microservices','ci/cd',
  'machine learning','deep learning','tensorflow','pytorch','scikit-learn','pandas','numpy',
  'html','css','tailwind','bootstrap','sass','webpack','vite',
  'figma','sketch','photoshop','illustrator',
  'agile','scrum','jira','confluence',
  'node.js','react.js','vue.js','next.js','express.js',
]

const SOFT_SKILLS = [
  'leadership','communication','teamwork','problem solving','critical thinking',
  'time management','adaptability','collaboration','mentoring','presentation',
  'project management','negotiation','creativity','attention to detail',
]

const EDUCATION_KEYWORDS = [
  'bachelor','master','phd','b.tech','m.tech','b.e','m.e','b.sc','m.sc',
  'mba','bca','mca','diploma','degree','university','college','institute',
  'gpa','cgpa','graduation','undergraduate','postgraduate',
]

const EXPERIENCE_KEYWORDS = [
  'experience','work','intern','internship','employed','company','organization',
  'project','developed','built','designed','implemented','led','managed',
  'collaborated','contributed','deployed','maintained','improved','reduced',
  'increased','achieved','awarded','responsible',
]

const PROJECT_KEYWORDS = [
  'project','built','developed','created','implemented','designed','deployed',
  'github','repository','open source','portfolio',
]

const RECOMMENDED_SKILLS = [
  'Docker','Kubernetes','CI/CD','GitHub Actions','AWS','System Design',
  'REST APIs','GraphQL','TypeScript','Jest','Agile/Scrum','Linux',
  'PostgreSQL','MongoDB','Redis',
]

// Job-role recommendation map: role → required skills (subset check)
const JOB_ROLES = [
  {
    role: 'Frontend Developer',
    skills: ['react','vue','angular','html','css','javascript','typescript','tailwind'],
    minMatch: 2,
  },
  {
    role: 'Backend Developer',
    skills: ['node','express','python','java','spring','django','flask','rest','graphql','sql','postgresql','mysql','mongodb'],
    minMatch: 3,
  },
  {
    role: 'Full Stack Developer',
    skills: ['react','node','javascript','sql','rest','html','css'],
    minMatch: 3,
  },
  {
    role: 'DevOps / Cloud Engineer',
    skills: ['docker','kubernetes','aws','azure','gcp','terraform','ansible','ci/cd','linux','bash','jenkins','github actions'],
    minMatch: 3,
  },
  {
    role: 'Data Scientist / ML Engineer',
    skills: ['python','machine learning','deep learning','tensorflow','pytorch','scikit-learn','pandas','numpy','sql'],
    minMatch: 3,
  },
  {
    role: 'Mobile Developer',
    skills: ['swift','kotlin','react','javascript','typescript'],
    minMatch: 2,
  },
  {
    role: 'Database Administrator',
    skills: ['sql','postgresql','mysql','mongodb','redis','elasticsearch','dynamodb'],
    minMatch: 2,
  },
  {
    role: 'Software Engineer (General)',
    skills: ['git','agile','scrum','rest','linux'],
    minMatch: 2,
  },
  {
    role: 'UI/UX Designer',
    skills: ['figma','sketch','photoshop','illustrator','css','html'],
    minMatch: 2,
  },
]

const ATS_KEYWORDS = [
  'achieved','improved','developed','managed','led','created','designed',
  'implemented','delivered','coordinated','spearheaded','optimized','streamlined',
]

// ---------------------------------------------------------------------------
// Local rule-based engine
// ---------------------------------------------------------------------------

export function localAnalyse(text) {
  const lower = text.toLowerCase()

  const foundTech  = TECH_SKILLS.filter(s => lower.includes(s))
  const foundSoft  = SOFT_SKILLS.filter(s => lower.includes(s))
  const allSkills  = [...new Set([...foundTech, ...foundSoft])]
    .map(s => s.charAt(0).toUpperCase() + s.slice(1))

  const missingSkills = RECOMMENDED_SKILLS.filter(
    s => !lower.includes(s.toLowerCase())
  )

  const hasEducation   = EDUCATION_KEYWORDS.some(k => lower.includes(k))
  const educationLines = text.split('\n')
    .filter(l => EDUCATION_KEYWORDS.some(k => l.toLowerCase().includes(k)))
    .slice(0, 3)
  const educationSummary = hasEducation
    ? educationLines.join(' ').replace(/\s+/g,' ').trim().slice(0, 300)
    : 'No education section detected.'

  const hasExperience   = EXPERIENCE_KEYWORDS.some(k => lower.includes(k))
  const experienceLines = text.split('\n')
    .filter(l => EXPERIENCE_KEYWORDS.some(k => l.toLowerCase().includes(k)))
    .slice(0, 4)
  const experienceSummary = hasExperience
    ? experienceLines.join(' ').replace(/\s+/g,' ').trim().slice(0, 400)
    : 'No work experience section detected.'

  const hasProjects    = PROJECT_KEYWORDS.some(k => lower.includes(k))
  const hasEmail       = /[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}/.test(lower)
  const hasPhone       = /(\+?\d[\d\s\-().]{7,}\d)/.test(text)
  const hasLinkedIn    = lower.includes('linkedin')
  const hasGitHub      = lower.includes('github')
  const charCount      = text.length
  const tooShort       = charCount < 500
  const tooLong        = charCount > 8000
  const hasSections    = /\b(education|experience|skills|projects|summary|objective|achievements|certifications)\b/i.test(text)
  const hasBullets     = text.includes('•') || text.includes('·') || (text.match(/-\s+[A-Z]/g) || []).length > 2
  const hasQuantified  = /\d+%|\d+\s*(million|thousand|users|customers|projects|teams|members|months|years)/i.test(text)
  const foundATSWords  = ATS_KEYWORDS.filter(k => lower.includes(k))
  const missingKeywords = ATS_KEYWORDS.filter(k => !lower.includes(k)).slice(0, 8)

  // ── Sub-scores ─────────────────────────────────────────────────────────────
  let skillsScore = Math.min(100, foundTech.length * 6 + foundSoft.length * 3)

  let experienceScore = 0
  if (hasExperience) {
    experienceScore += 50
    if (hasQuantified)  experienceScore += 25
    if (hasBullets)     experienceScore += 15
    if (experienceLines.length >= 3) experienceScore += 10
  }
  experienceScore = Math.min(100, experienceScore)

  let educationScore = 0
  if (hasEducation) {
    educationScore += 70
    if (/bachelor|master|phd|b\.tech|m\.tech/i.test(text)) educationScore += 20
    if (/gpa|cgpa|\d\.\d/i.test(text))                      educationScore += 10
  }
  educationScore = Math.min(100, educationScore)

  let projectsScore = 0
  if (hasProjects) {
    projectsScore += 50
    if (hasGitHub)                         projectsScore += 20
    if ((text.match(/project/gi) || []).length >= 2) projectsScore += 20
    if (hasQuantified)                     projectsScore += 10
  }
  projectsScore = Math.min(100, projectsScore)

  let formattingScore = 0
  if (hasSections)  formattingScore += 30
  if (hasBullets)   formattingScore += 25
  if (hasEmail)     formattingScore += 15
  if (hasPhone)     formattingScore += 10
  if (hasLinkedIn)  formattingScore += 10
  if (!tooShort && !tooLong) formattingScore += 10
  formattingScore = Math.min(100, formattingScore)

  let keywordScore = Math.min(100, foundATSWords.length * 12 + foundTech.length * 3)

  let atsScore = 0
  if (hasSections)   atsScore += 20
  if (hasBullets)    atsScore += 20
  if (hasEmail)      atsScore += 15
  if (hasPhone)      atsScore += 10
  if (foundTech.length >= 5) atsScore += 20
  if (hasQuantified) atsScore += 15
  atsScore = Math.min(100, atsScore)

  // ── Overall score ──────────────────────────────────────────────────────────
  let score = Math.round(
    skillsScore     * 0.25 +
    experienceScore * 0.25 +
    educationScore  * 0.15 +
    projectsScore   * 0.10 +
    formattingScore * 0.10 +
    keywordScore    * 0.10 +
    atsScore        * 0.05
  )
  score = Math.max(10, Math.min(100, score))

  // ── Strengths / Weaknesses ─────────────────────────────────────────────────
  const strengths = []
  if (foundTech.length >= 5)  strengths.push(`Strong technical skill set (${foundTech.length} technologies detected)`)
  if (hasExperience)          strengths.push('Work experience or project section present')
  if (hasEducation)           strengths.push('Education section clearly included')
  if (hasEmail && hasPhone)   strengths.push('Contact information is complete')
  if (hasLinkedIn)            strengths.push('LinkedIn profile linked')
  if (hasGitHub)              strengths.push('GitHub profile linked — great for technical roles')
  if (hasBullets)             strengths.push('Uses bullet points for readability')
  if (hasQuantified)          strengths.push('Includes quantified achievements')
  if (hasSections)            strengths.push('Resume has clear section headings')
  if (foundSoft.length >= 3)  strengths.push(`Soft skills highlighted (${foundSoft.length} found)`)
  if (hasProjects)            strengths.push('Projects section shows hands-on experience')

  const weaknesses = []
  if (tooShort)               weaknesses.push('Resume content is very short — consider expanding')
  if (tooLong)                weaknesses.push('Resume is very long — aim for 1–2 pages')
  if (!hasEmail)              weaknesses.push('No email address detected')
  if (!hasPhone)              weaknesses.push('No phone number detected')
  if (!hasLinkedIn)           weaknesses.push('LinkedIn profile not included')
  if (!hasGitHub && foundTech.length > 0) weaknesses.push('No GitHub link — important for tech roles')
  if (!hasSections)           weaknesses.push('Missing clear section headings (Skills, Experience, Education)')
  if (!hasBullets)            weaknesses.push('No bullet points — harder for recruiters to scan')
  if (!hasQuantified)         weaknesses.push('No quantified results (e.g. "improved performance by 30%")')
  if (foundTech.length < 3)   weaknesses.push('Very few technical skills detected')
  if (!hasProjects)           weaknesses.push('No projects section — add personal or academic projects')

  const suggestions = []
  if (!hasQuantified)       suggestions.push('Add numbers and metrics to achievements (e.g. "reduced load time by 40%")')
  if (!hasGitHub)           suggestions.push('Add your GitHub profile URL to showcase code')
  if (!hasLinkedIn)         suggestions.push('Add your LinkedIn profile URL for recruiter visibility')
  if (missingSkills.length) suggestions.push(`Consider adding in-demand skills: ${missingSkills.slice(0,4).join(', ')}`)
  if (!hasBullets)          suggestions.push('Use bullet points to describe each role and project')
  if (!hasSections)         suggestions.push('Add clear section headings: Summary, Experience, Education, Skills')
  if (tooShort)             suggestions.push('Expand your resume — aim for at least one full page')
  if (!hasProjects)         suggestions.push('Add a Projects section with 2–3 relevant projects')
  suggestions.push('Tailor your resume to each job description using relevant keywords')
  suggestions.push('Proofread for grammar and spelling errors')
  suggestions.push('Use a clean, single-column layout for ATS compatibility')

  const atsPoints = []
  if (!hasSections)   atsPoints.push('Missing section headings reduces ATS parse accuracy.')
  if (hasBullets)     atsPoints.push('Bullet points are ATS-friendly.')
  else                atsPoints.push('Switch to bullet points — ATS scanners prefer structured lists.')
  if (hasEmail)       atsPoints.push('Email detected — ATS can extract contact info.')
  if (foundTech.length >= 5) atsPoints.push(`${foundTech.length} technical keywords detected — good keyword density.`)
  else                atsPoints.push('Low keyword density — add more role-specific technical terms.')
  atsPoints.push('Avoid tables, columns, or text boxes — they confuse most ATS systems.')
  atsPoints.push('Save and submit as a standard PDF for best ATS compatibility.')
  if (hasQuantified)  atsPoints.push('Quantified achievements improve relevance scoring in ATS.')

  // ── Detected keywords ─────────────────────────────────────────────────────
  const keywords = [
    ...foundATSWords.map(k => k.charAt(0).toUpperCase() + k.slice(1)),
    ...foundTech.slice(0, 10).map(k => k.charAt(0).toUpperCase() + k.slice(1)),
  ]

  // ── Job-role recommendations ───────────────────────────────────────────────
  const jobRoleRecommendations = JOB_ROLES
    .map(({ role, skills, minMatch }) => {
      const matched = skills.filter(s => lower.includes(s))
      const matchPct = Math.round((matched.length / skills.length) * 100)
      return { role, matchPct, matched: matched.length, required: skills.length }
    })
    .filter(r => r.matched >= (JOB_ROLES.find(j => j.role === r.role)?.minMatch ?? 2))
    .sort((a, b) => b.matchPct - a.matchPct)
    .slice(0, 5)
    .map(r => `${r.role} (${r.matchPct}% match)`)

  return {
    score,
    atsScore,
    skillsScore,
    experienceScore,
    educationScore,
    projectsScore,
    formattingScore,
    keywordScore,
    skills:                  allSkills,
    strengths:               strengths.length  ? strengths  : ['Resume submitted for review'],
    weaknesses:              weaknesses.length ? weaknesses : ['No major issues detected'],
    missingSkills,
    missingKeywords,
    suggestions,
    keywords,
    jobRoleRecommendations:  jobRoleRecommendations.length ? jobRoleRecommendations : ['Software Engineer (General)'],
    experienceSummary,
    educationSummary,
    atsFeedback:             atsPoints.join(' '),
    provider:                'local',
  }
}

// ---------------------------------------------------------------------------
// IBM IAM token exchange (for watsonx fallback)
// ---------------------------------------------------------------------------

async function getIAMToken() {
  const resp = await fetch('https://iam.cloud.ibm.com/identity/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'urn:ibm:params:oauth:grant-type:apikey',
      apikey:     process.env.WATSONX_API_KEY,
    }),
  })
  if (!resp.ok) throw new Error(`IAM token exchange failed (HTTP ${resp.status}).`)
  const data = await resp.json()
  if (!data.access_token) throw new Error('IAM response did not contain access_token.')
  return data.access_token
}

const WATSONX_MODEL   = 'ibm/granite-13b-instruct-v2'
const WATSONX_VERSION = '2023-05-29'

function buildPrompt(text) {
  return `You are an expert resume reviewer. Analyse the following resume and respond with ONLY valid JSON, no markdown.

JSON keys required: score (0-100), atsScore (0-100), skillsScore (0-100), experienceScore (0-100), educationScore (0-100), projectsScore (0-100), formattingScore (0-100), keywordScore (0-100), skills (array), strengths (array), weaknesses (array), missingSkills (array), missingKeywords (array), suggestions (array), keywords (array), jobRoleRecommendations (array of strings like "Role Name (XX% match)"), experienceSummary (string), educationSummary (string), atsFeedback (string)

Resume:
---
${text.slice(0, 6000)}
---

JSON only:`
}

async function watsonxAnalyse(text) {
  let iamToken
  try {
    iamToken = await getIAMToken()
  } catch (err) {
    console.warn(`[aiProvider] IAM error: ${err.message} — using local engine`)
    return localAnalyse(text)
  }

  const url = `${process.env.WATSONX_URL}/ml/v1/text/generation?version=${WATSONX_VERSION}`
  let resp
  try {
    resp = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${iamToken}` },
      body: JSON.stringify({
        model_id:   WATSONX_MODEL,
        project_id: process.env.WATSONX_PROJECT_ID,
        input:      buildPrompt(text),
        parameters: { decoding_method: 'greedy', max_new_tokens: 1200, stop_sequences: ['}'] },
      }),
    })
  } catch {
    console.warn('[aiProvider] watsonx network error — using local engine')
    return localAnalyse(text)
  }

  if (!resp.ok) {
    console.warn(`[aiProvider] watsonx HTTP ${resp.status} — using local engine`)
    return localAnalyse(text)
  }

  let body
  try { body = await resp.json() } catch {
    return localAnalyse(text)
  }

  const generated = body?.results?.[0]?.generated_text ?? ''
  const jsonStr   = (generated + '}').trim()
  let parsed
  try {
    const start = jsonStr.indexOf('{')
    const end   = jsonStr.lastIndexOf('}')
    parsed = JSON.parse(jsonStr.slice(start, end + 1))
  } catch {
    console.warn('[aiProvider] watsonx JSON parse failed — using local engine')
    return localAnalyse(text)
  }

  const local = localAnalyse(text)
  const pick = (v, fb) => (v !== undefined && v !== null ? v : fb)
  return {
    score:                    typeof parsed.score === 'number'        ? Math.max(0, Math.min(100, parsed.score)) : local.score,
    atsScore:                 typeof parsed.atsScore === 'number'     ? parsed.atsScore     : local.atsScore,
    skillsScore:              typeof parsed.skillsScore === 'number'  ? parsed.skillsScore  : local.skillsScore,
    experienceScore:          typeof parsed.experienceScore === 'number' ? parsed.experienceScore : local.experienceScore,
    educationScore:           typeof parsed.educationScore === 'number'  ? parsed.educationScore  : local.educationScore,
    projectsScore:            typeof parsed.projectsScore === 'number'   ? parsed.projectsScore   : local.projectsScore,
    formattingScore:          typeof parsed.formattingScore === 'number' ? parsed.formattingScore : local.formattingScore,
    keywordScore:             typeof parsed.keywordScore === 'number'    ? parsed.keywordScore    : local.keywordScore,
    skills:                   Array.isArray(parsed.skills)          ? parsed.skills          : local.skills,
    strengths:                Array.isArray(parsed.strengths)       ? parsed.strengths       : local.strengths,
    weaknesses:               Array.isArray(parsed.weaknesses)      ? parsed.weaknesses      : local.weaknesses,
    missingSkills:            Array.isArray(parsed.missingSkills)   ? parsed.missingSkills   : local.missingSkills,
    missingKeywords:          Array.isArray(parsed.missingKeywords) ? parsed.missingKeywords : local.missingKeywords,
    suggestions:              Array.isArray(parsed.suggestions)     ? parsed.suggestions     : local.suggestions,
    keywords:                 Array.isArray(parsed.keywords)        ? parsed.keywords        : local.keywords,
    jobRoleRecommendations:   Array.isArray(parsed.jobRoleRecommendations) ? parsed.jobRoleRecommendations : local.jobRoleRecommendations,
    experienceSummary:        pick(parsed.experienceSummary, local.experienceSummary),
    educationSummary:         pick(parsed.educationSummary,  local.educationSummary),
    atsFeedback:              pick(parsed.atsFeedback,        local.atsFeedback),
    provider:                 'watsonx',
  }
}

// ---------------------------------------------------------------------------
// Public export
// ---------------------------------------------------------------------------

export async function analyseResume(text) {
  const hasWatsonx =
    process.env.WATSONX_API_KEY    &&
    process.env.WATSONX_PROJECT_ID &&
    process.env.WATSONX_URL

  if (hasWatsonx) return watsonxAnalyse(text)
  return localAnalyse(text)
}
