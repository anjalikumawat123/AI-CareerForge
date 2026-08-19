# AI CareerForge — Architecture Overview

## Project Layout

```
AI-CareerForge/
├── client/          # React + Vite frontend
├── server/          # Node.js + Express backend
└── docs/            # Architecture notes and planning docs
```

## Planned Modules (build order)

| # | Module | Status |
|---|--------|--------|
| 1 | Project Foundation (Frontend ↔ Backend ↔ Health API) | ✅ Done |
| 2 | Authentication (JWT + bcrypt, Register/Login) | 🔜 Next |
| 3 | PostgreSQL Database + User model | 🔜 |
| 4 | Resume Upload + IBM COS file storage | 🔜 |
| 5 | AI Resume Analysis (IBM watsonx.ai) | 🔜 |
| 6 | Interview Simulator (AI-powered) | 🔜 |
| 7 | Career Analytics Dashboard | 🔜 |
| 8 | Job Matching Engine | 🔜 |
| 9 | Cloud Deployment (IBM Cloud) | 🔜 |

## API Conventions

- All endpoints are prefixed `/api/`
- JSON request and response bodies
- Error shape: `{ "error": "message" }`
- Auth: Bearer token in `Authorization` header (JWT)

## Environment Variables

See `server/.env.example` and `client/.env.example` for all variables.
