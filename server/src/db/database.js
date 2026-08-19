/**
 * src/db/database.js
 * Initialises the SQLite database using better-sqlite3.
 */

import Database from 'better-sqlite3'
import { mkdirSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))

const dbPath = resolve(
  __dirname,
  '../..',
  process.env.DB_PATH ?? 'data/careerforge.db'
)

mkdirSync(dirname(dbPath), { recursive: true })

const db = new Database(dbPath)

db.pragma('journal_mode = WAL')
db.pragma('foreign_keys = ON')

// ---------------------------------------------------------------------------
// Schema migrations — idempotent CREATE IF NOT EXISTS
// ---------------------------------------------------------------------------

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id            INTEGER PRIMARY KEY AUTOINCREMENT,
    name          TEXT    NOT NULL,
    email         TEXT    NOT NULL UNIQUE,
    password_hash TEXT    NOT NULL,
    created_at    TEXT    NOT NULL,
    updated_at    TEXT    NOT NULL
  );

  CREATE TABLE IF NOT EXISTS resumes (
    id           INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id      INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    filename     TEXT    NOT NULL,
    stored_name  TEXT    NOT NULL DEFAULT '',
    file_size    INTEGER NOT NULL DEFAULT 0,
    mime_type    TEXT    NOT NULL DEFAULT 'application/pdf',
    uploaded_at  TEXT    NOT NULL,

    -- Structured resume form fields
    full_name    TEXT    DEFAULT '',
    email        TEXT    DEFAULT '',
    phone        TEXT    DEFAULT '',
    location     TEXT    DEFAULT '',
    linkedin     TEXT    DEFAULT '',
    github       TEXT    DEFAULT '',
    portfolio    TEXT    DEFAULT '',
    summary      TEXT    DEFAULT '',
    education    TEXT    DEFAULT '[]',
    skills       TEXT    DEFAULT '[]',
    experience   TEXT    DEFAULT '[]',
    projects     TEXT    DEFAULT '[]',
    certifications TEXT  DEFAULT '[]',
    achievements TEXT    DEFAULT '[]',
    resume_type  TEXT    NOT NULL DEFAULT 'pdf'
  );

  CREATE TABLE IF NOT EXISTS resume_analyses (
    id                  INTEGER PRIMARY KEY AUTOINCREMENT,
    resume_id           INTEGER NOT NULL REFERENCES resumes(id) ON DELETE CASCADE,
    user_id             INTEGER NOT NULL REFERENCES users(id)   ON DELETE CASCADE,
    score               INTEGER NOT NULL DEFAULT 0,
    ats_score           INTEGER NOT NULL DEFAULT 0,
    skills_score        INTEGER NOT NULL DEFAULT 0,
    experience_score    INTEGER NOT NULL DEFAULT 0,
    education_score     INTEGER NOT NULL DEFAULT 0,
    projects_score      INTEGER NOT NULL DEFAULT 0,
    formatting_score    INTEGER NOT NULL DEFAULT 0,
    keyword_score       INTEGER NOT NULL DEFAULT 0,
    skills              TEXT    NOT NULL DEFAULT '[]',
    strengths           TEXT    NOT NULL DEFAULT '[]',
    weaknesses          TEXT    NOT NULL DEFAULT '[]',
    missing_skills      TEXT    NOT NULL DEFAULT '[]',
    missing_keywords    TEXT    NOT NULL DEFAULT '[]',
    suggestions         TEXT    NOT NULL DEFAULT '[]',
    keywords            TEXT    NOT NULL DEFAULT '[]',
    experience_summary  TEXT    NOT NULL DEFAULT '',
    education_summary   TEXT    NOT NULL DEFAULT '',
    ats_feedback        TEXT    NOT NULL DEFAULT '',
    provider            TEXT    NOT NULL DEFAULT 'local',
    analysed_at         TEXT    NOT NULL
  );

  CREATE TABLE IF NOT EXISTS job_matches (
    id                INTEGER PRIMARY KEY AUTOINCREMENT,
    resume_id         INTEGER NOT NULL REFERENCES resumes(id) ON DELETE CASCADE,
    user_id           INTEGER NOT NULL REFERENCES users(id)   ON DELETE CASCADE,
    job_title         TEXT    NOT NULL DEFAULT '',
    job_description   TEXT    NOT NULL DEFAULT '',
    match_score       INTEGER NOT NULL DEFAULT 0,
    matching_skills   TEXT    NOT NULL DEFAULT '[]',
    missing_skills    TEXT    NOT NULL DEFAULT '[]',
    matching_keywords TEXT    NOT NULL DEFAULT '[]',
    missing_keywords  TEXT    NOT NULL DEFAULT '[]',
    suggestions       TEXT    NOT NULL DEFAULT '[]',
    created_at        TEXT    NOT NULL
  );

  CREATE TABLE IF NOT EXISTS interview_sessions (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id         INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    job_role        TEXT    NOT NULL DEFAULT '',
    experience_level TEXT   NOT NULL DEFAULT 'junior',
    interview_type  TEXT    NOT NULL DEFAULT 'mixed',
    status          TEXT    NOT NULL DEFAULT 'in_progress',
    total_score     INTEGER NOT NULL DEFAULT 0,
    avg_score       REAL    NOT NULL DEFAULT 0,
    questions_count INTEGER NOT NULL DEFAULT 0,
    summary         TEXT    NOT NULL DEFAULT '',
    started_at      TEXT    NOT NULL,
    completed_at    TEXT
  );

  CREATE TABLE IF NOT EXISTS interview_answers (
    id                INTEGER PRIMARY KEY AUTOINCREMENT,
    session_id        INTEGER NOT NULL REFERENCES interview_sessions(id) ON DELETE CASCADE,
    user_id           INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    question_index    INTEGER NOT NULL DEFAULT 0,
    question          TEXT    NOT NULL DEFAULT '',
    question_type     TEXT    NOT NULL DEFAULT 'behavioral',
    answer            TEXT    NOT NULL DEFAULT '',
    score             INTEGER NOT NULL DEFAULT 0,
    feedback          TEXT    NOT NULL DEFAULT '',
    suggestions       TEXT    NOT NULL DEFAULT '[]',
    answered_at       TEXT    NOT NULL
  );
`)

// ---------------------------------------------------------------------------
// Migrations — add columns that may not exist in older DBs
// ---------------------------------------------------------------------------

const resumeNewCols = [
  { name: 'full_name',       def: "TEXT DEFAULT ''"   },
  { name: 'email',           def: "TEXT DEFAULT ''"   },
  { name: 'phone',           def: "TEXT DEFAULT ''"   },
  { name: 'location',        def: "TEXT DEFAULT ''"   },
  { name: 'linkedin',        def: "TEXT DEFAULT ''"   },
  { name: 'github',          def: "TEXT DEFAULT ''"   },
  { name: 'portfolio',       def: "TEXT DEFAULT ''"   },
  { name: 'summary',         def: "TEXT DEFAULT ''"   },
  { name: 'education',       def: "TEXT DEFAULT '[]'" },
  { name: 'skills',          def: "TEXT DEFAULT '[]'" },
  { name: 'experience',      def: "TEXT DEFAULT '[]'" },
  { name: 'projects',        def: "TEXT DEFAULT '[]'" },
  { name: 'certifications',  def: "TEXT DEFAULT '[]'" },
  { name: 'achievements',    def: "TEXT DEFAULT '[]'" },
  { name: 'resume_type',     def: "TEXT NOT NULL DEFAULT 'pdf'" },
]

const analysisNewCols = [
  { name: 'ats_score',                def: 'INTEGER NOT NULL DEFAULT 0'  },
  { name: 'skills_score',             def: 'INTEGER NOT NULL DEFAULT 0'  },
  { name: 'experience_score',         def: 'INTEGER NOT NULL DEFAULT 0'  },
  { name: 'education_score',          def: 'INTEGER NOT NULL DEFAULT 0'  },
  { name: 'projects_score',           def: 'INTEGER NOT NULL DEFAULT 0'  },
  { name: 'formatting_score',         def: 'INTEGER NOT NULL DEFAULT 0'  },
  { name: 'keyword_score',            def: 'INTEGER NOT NULL DEFAULT 0'  },
  { name: 'missing_keywords',         def: "TEXT NOT NULL DEFAULT '[]'"  },
  { name: 'keywords',                 def: "TEXT NOT NULL DEFAULT '[]'"  },
  { name: 'job_role_recommendations', def: "TEXT NOT NULL DEFAULT '[]'"  },
]

function addColIfMissing(table, cols) {
  const existing = db.pragma(`table_info(${table})`).map(c => c.name)
  for (const { name, def } of cols) {
    if (!existing.includes(name)) {
      db.exec(`ALTER TABLE ${table} ADD COLUMN ${name} ${def}`)
    }
  }
}

addColIfMissing('resumes', resumeNewCols)
addColIfMissing('resume_analyses', analysisNewCols)

console.log(`[db] SQLite database ready: ${dbPath}`)

export default db
