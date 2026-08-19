/**
 * services/interviewService.js
 * Interview simulator with local question bank and answer evaluation.
 */

import * as interviewRepo from '../repositories/interviewRepository.js'

function interviewError(msg, code = 400) {
  const e = new Error(msg); e.statusCode = code; return e
}

// ---------------------------------------------------------------------------
// Question bank
// ---------------------------------------------------------------------------

const QUESTIONS = {
  technical: {
    junior: [
      { q: 'What is the difference between let, const, and var in JavaScript?', type: 'technical' },
      { q: 'Explain what REST API is and how it works.', type: 'technical' },
      { q: 'What is a database index and why is it used?', type: 'technical' },
      { q: 'Explain the concept of version control and why it is important.', type: 'technical' },
      { q: 'What is the difference between SQL and NoSQL databases?', type: 'technical' },
      { q: 'What is Object-Oriented Programming? Name the four pillars.', type: 'technical' },
      { q: 'What is the difference between GET and POST requests?', type: 'technical' },
    ],
    mid: [
      { q: 'Explain the SOLID principles in software engineering.', type: 'technical' },
      { q: 'What is a microservices architecture and when would you use it?', type: 'technical' },
      { q: 'How does database indexing improve query performance?', type: 'technical' },
      { q: 'Explain the difference between synchronous and asynchronous programming.', type: 'technical' },
      { q: 'What is a design pattern? Give two examples with use cases.', type: 'technical' },
      { q: 'How does JWT authentication work?', type: 'technical' },
      { q: 'Explain the concept of database normalization.', type: 'technical' },
    ],
    senior: [
      { q: 'How would you design a scalable URL shortener like bit.ly?', type: 'technical' },
      { q: 'Explain CAP theorem and its implications for distributed systems.', type: 'technical' },
      { q: 'How do you approach database schema design for high-traffic applications?', type: 'technical' },
      { q: 'What strategies do you use to optimize frontend performance?', type: 'technical' },
      { q: 'How would you implement a rate-limiting system?', type: 'technical' },
      { q: 'Explain your approach to code reviews and maintaining code quality.', type: 'technical' },
    ],
  },
  behavioral: {
    junior: [
      { q: 'Tell me about a challenging project you worked on and how you handled it.', type: 'behavioral' },
      { q: 'Describe a time when you had to learn a new technology quickly. How did you approach it?', type: 'behavioral' },
      { q: 'How do you handle receiving critical feedback on your work?', type: 'behavioral' },
      { q: 'Tell me about a time you worked effectively in a team.', type: 'behavioral' },
      { q: 'Describe a situation where you had to meet a tight deadline.', type: 'behavioral' },
    ],
    mid: [
      { q: 'Tell me about a time you led a project or initiative.', type: 'behavioral' },
      { q: 'Describe a conflict with a team member and how you resolved it.', type: 'behavioral' },
      { q: 'How do you prioritize tasks when you have multiple deadlines?', type: 'behavioral' },
      { q: 'Tell me about a time you made a significant technical decision.', type: 'behavioral' },
      { q: 'How have you mentored or helped junior developers?', type: 'behavioral' },
    ],
    senior: [
      { q: 'How do you drive technical strategy and get buy-in from stakeholders?', type: 'behavioral' },
      { q: 'Describe how you handled a major production incident.', type: 'behavioral' },
      { q: 'How do you build and motivate a high-performing engineering team?', type: 'behavioral' },
      { q: 'Tell me about a time you had to make a difficult trade-off between speed and quality.', type: 'behavioral' },
    ],
  },
  hr: {
    junior: [
      { q: 'Why are you interested in this role?', type: 'hr' },
      { q: 'Where do you see yourself in 3 years?', type: 'hr' },
      { q: 'What are your greatest strengths and one area for improvement?', type: 'hr' },
      { q: 'Why did you choose this career path?', type: 'hr' },
      { q: 'What motivates you at work?', type: 'hr' },
    ],
    mid: [
      { q: 'What are your salary expectations?', type: 'hr' },
      { q: 'Why are you leaving your current role?', type: 'hr' },
      { q: 'What kind of work environment do you thrive in?', type: 'hr' },
      { q: 'How do you stay up to date with industry trends?', type: 'hr' },
      { q: 'What do you consider your biggest professional achievement?', type: 'hr' },
    ],
    senior: [
      { q: 'How do you balance technical excellence with business needs?', type: 'hr' },
      { q: 'How do you approach continuous learning and professional development?', type: 'hr' },
      { q: 'What is your leadership philosophy?', type: 'hr' },
      { q: 'How do you handle organizational change?', type: 'hr' },
    ],
  },
}

function getQuestions(jobRole, experienceLevel, interviewType, count = 5) {
  const level  = ['junior','mid','senior'].includes(experienceLevel) ? experienceLevel : 'junior'

  let pool = []
  if (interviewType === 'mixed') {
    pool = [
      ...(QUESTIONS.technical[level] || []),
      ...(QUESTIONS.behavioral[level] || []),
      ...(QUESTIONS.hr[level] || []),
    ]
  } else {
    pool = QUESTIONS[interviewType]?.[level] || QUESTIONS.technical[level] || []
  }

  // Shuffle
  const shuffled = [...pool].sort(() => Math.random() - 0.5)
  return shuffled.slice(0, Math.min(count, shuffled.length))
}

// ---------------------------------------------------------------------------
// Answer evaluation
// ---------------------------------------------------------------------------

const GOOD_ANSWER_SIGNALS = [
  'because','therefore','for example','specifically','resulted in','led to','achieved',
  'improved','reduced','increased','successfully','we','our team','i implemented',
  'i designed','i built','first','then','finally','as a result',
]

const TECHNICAL_SIGNALS = [
  'function','class','method','api','database','algorithm','performance','scale',
  'architecture','design pattern','framework','library','code','implement','deploy',
  'test','debug','optimize','refactor',
]

function evaluateAnswer(question, answer, questionType) {
  if (!answer || answer.trim().length < 20) {
    return {
      score: 0,
      feedback: 'No meaningful answer provided. Please elaborate on your response.',
      suggestions: ['Write at least 2-3 sentences', 'Use the STAR method (Situation, Task, Action, Result)', 'Be specific with examples'],
    }
  }

  const lower  = answer.toLowerCase()
  const words  = answer.trim().split(/\s+/)
  const wcount = words.length

  let score = 30 // base score for answering

  // Length score
  if (wcount >= 50)  score += 15
  if (wcount >= 100) score += 10
  if (wcount >= 200) score += 5

  // Good answer signals
  const signalCount = GOOD_ANSWER_SIGNALS.filter(s => lower.includes(s)).length
  score += Math.min(signalCount * 5, 20)

  // Technical signals for technical questions
  if (questionType === 'technical') {
    const techCount = TECHNICAL_SIGNALS.filter(s => lower.includes(s)).length
    score += Math.min(techCount * 5, 15)
  }

  // STAR method signals
  const hasSituation = /situation|context|background|when i|at my|at the/i.test(answer)
  const hasAction    = /i (did|implemented|built|created|designed|managed|led|worked)/i.test(answer)
  const hasResult    = /result|outcome|achieved|improved|reduced|increased|successfully/i.test(answer)
  if (hasSituation && hasAction && hasResult) score += 10

  // Specificity
  if (/\d+/.test(answer)) score += 5  // uses numbers

  score = Math.min(100, Math.max(10, score))

  // Feedback
  const feedbackParts = []
  const suggestions   = []

  if (score >= 80) {
    feedbackParts.push('Excellent response! Well-structured and detailed.')
  } else if (score >= 60) {
    feedbackParts.push('Good answer with solid content.')
  } else if (score >= 40) {
    feedbackParts.push('Decent answer, but could be more detailed.')
  } else {
    feedbackParts.push('Your answer needs more depth and specificity.')
  }

  if (wcount < 50)   suggestions.push('Expand your answer with more detail — aim for 100+ words')
  if (!hasAction)    suggestions.push('Describe what YOU specifically did — use "I implemented...", "I designed..."')
  if (!hasResult)    suggestions.push('Include the outcome or result to complete your story')
  if (!hasSituation && questionType === 'behavioral') suggestions.push('Set the context first — describe the situation or challenge')
  if (!/\d+/.test(answer)) suggestions.push('Add quantifiable metrics (e.g., "improved by 40%", "handled 1000 users")')
  if (questionType === 'technical' && TECHNICAL_SIGNALS.filter(s => lower.includes(s)).length < 2) {
    suggestions.push('Use more technical terminology to demonstrate depth of knowledge')
  }

  if (suggestions.length === 0) suggestions.push('Great answer! Keep giving examples with measurable outcomes')

  return { score, feedback: feedbackParts.join(' '), suggestions }
}

function generateSummary(answers) {
  if (!answers.length) return 'No answers recorded.'
  const avg = answers.reduce((s, a) => s + a.score, 0) / answers.length
  if (avg >= 80) return `Outstanding performance! Average score: ${Math.round(avg)}/100. You demonstrated excellent communication and technical depth across all questions.`
  if (avg >= 65) return `Good performance! Average score: ${Math.round(avg)}/100. You showed solid competency. Focus on adding more specific examples and quantified results.`
  if (avg >= 50) return `Moderate performance. Average score: ${Math.round(avg)}/100. Work on providing more structured, detailed answers using the STAR method.`
  return `Needs improvement. Average score: ${Math.round(avg)}/100. Practice structuring your answers with clear examples, actions, and measurable results.`
}

// ---------------------------------------------------------------------------
// Service methods
// ---------------------------------------------------------------------------

export async function createSession({ userId, jobRole, experienceLevel, interviewType }) {
  const session = await interviewRepo.createSession({ userId, jobRole, experienceLevel, interviewType })
  const questions = getQuestions(jobRole, experienceLevel, interviewType)
  return { session, questions }
}

export async function getSession(id, userId) {
  const session = await interviewRepo.findSessionById(id)
  if (!session)                  throw interviewError('Session not found', 404)
  if (session.user_id !== userId) throw interviewError('Forbidden', 403)

  const answers = await interviewRepo.findAnswersBySession(id)
  const questions = getQuestions(session.job_role, session.experience_level, session.interview_type)
  return { session, answers, questions }
}

export async function getSessions(userId) {
  return interviewRepo.findSessionsByUser(userId)
}

export async function submitAnswer({ sessionId, userId, questionIndex, question, questionType, answer }) {
  const session = await interviewRepo.findSessionById(sessionId)
  if (!session)                  throw interviewError('Session not found', 404)
  if (session.user_id !== userId) throw interviewError('Forbidden', 403)
  if (session.status === 'completed') throw interviewError('Interview already completed', 400)

  const { score, feedback, suggestions } = evaluateAnswer(question, answer, questionType)

  const savedAnswer = await interviewRepo.insertAnswer({
    sessionId, userId, questionIndex, question, questionType, answer, score, feedback, suggestions,
  })

  const allAnswers = await interviewRepo.findAnswersBySession(sessionId)
  return { answer: savedAnswer, allAnswers }
}

export async function completeSession(sessionId, userId) {
  const session = await interviewRepo.findSessionById(sessionId)
  if (!session)                  throw interviewError('Session not found', 404)
  if (session.user_id !== userId) throw interviewError('Forbidden', 403)

  const answers = await interviewRepo.findAnswersBySession(sessionId)
  if (!answers.length) throw interviewError('No answers recorded', 400)

  const totalScore  = answers.reduce((s, a) => s + a.score, 0)
  const avgScore    = totalScore / answers.length
  const summary     = generateSummary(answers)

  const updated = await interviewRepo.updateSession({
    id: sessionId, userId,
    status: 'completed', totalScore, avgScore,
    questionsCount: answers.length, summary,
  })
  return { session: updated, answers, summary }
}

export async function deleteSession(id, userId) {
  const session = await interviewRepo.findSessionById(id)
  if (!session)                  throw interviewError('Session not found', 404)
  if (session.user_id !== userId) throw interviewError('Forbidden', 403)
  await interviewRepo.deleteSession(id)
}
