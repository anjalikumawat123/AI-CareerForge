/**
 * server/src/index.js
 * Application entry point.
 */

import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import healthRouter   from './routes/health.js'
import authRouter     from './routes/auth.js'
import resumeRouter   from './routes/resume.js'
import jobMatchRouter from './routes/jobMatch.js'
import interviewRouter from './routes/interview.js'
import analyticsRouter from './routes/analytics.js'

const app  = express()
const PORT = process.env.PORT ?? 5000

// Allow both the production Render URL and local dev
const allowedOrigins = (process.env.CLIENT_ORIGIN ?? 'http://localhost:5173')
  .split(',')
  .map(o => o.trim())

app.use(cors({
  origin: (origin, cb) => {
    // Allow requests with no origin (curl, mobile apps, server-to-server)
    if (!origin) return cb(null, true)
    if (allowedOrigins.includes(origin)) return cb(null, true)
    return cb(new Error(`CORS: origin ${origin} not allowed`))
  },
  optionsSuccessStatus: 200,
  credentials: true,
}))
app.use(express.json())

app.use('/api',            healthRouter)
app.use('/api/auth',       authRouter)
app.use('/api/resumes',    resumeRouter)
app.use('/api/job-match',  jobMatchRouter)
app.use('/api/interviews', interviewRouter)
app.use('/api/analytics',  analyticsRouter)

app.use((_req, res) => {
  res.status(404).json({ error: 'Route not found' })
})

app.listen(PORT, () => {
  console.log(`[server] AI CareerForge API running on http://localhost:${PORT}`)
})
