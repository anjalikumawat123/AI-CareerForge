# AI CareerForge

> AI-powered career and placement platform for college students — built with React, Node.js, and IBM watsonx.ai.

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18 + Vite + Tailwind CSS |
| Backend | Node.js + Express |
| Database | PostgreSQL *(coming soon)* |
| Authentication | JWT + bcrypt *(coming soon)* |
| AI | IBM watsonx.ai *(coming soon)* |
| File Storage | IBM Cloud Object Storage *(coming soon)* |
| Deployment | IBM Cloud *(coming soon)* |

---

## Project Structure

```
AI-CareerForge/
├── client/                  # React + Vite frontend
│   ├── src/
│   │   ├── api/             # Centralised fetch helpers
│   │   ├── components/      # Reusable UI components
│   │   ├── App.jsx          # Root component
│   │   └── main.jsx         # React entry point
│   ├── index.html
│   ├── vite.config.js
│   └── package.json
│
├── server/                  # Express REST API
│   ├── src/
│   │   ├── routes/          # Route handlers
│   │   └── index.js         # Server entry point
│   ├── .env.example
│   └── package.json
│
├── docs/                    # Architecture docs
│   └── ARCHITECTURE.md
│
├── .gitignore
└── README.md
```

---

## Getting Started

### Prerequisites
- Node.js 18 or later
- npm 9 or later

### 1. Install dependencies

```bash
# Frontend
cd client
npm install

# Backend
cd ../server
npm install
```

### 2. Configure environment variables

```bash
# Backend
cp server/.env.example server/.env
# Edit server/.env if needed (defaults work for local dev)

# Frontend — defaults work, no changes needed
```

### 3. Start the backend

```bash
cd server
npm run dev
```
Server starts at **http://localhost:5000**

### 4. Start the frontend (new terminal)

```bash
cd client
npm run dev
```
App opens at **http://localhost:5173**

### 5. Test the health API

Open your browser or run:
```bash
curl http://localhost:5000/api/health
```

Expected response:
```json
{
  "status": "ok",
  "message": "AI CareerForge API is running",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "environment": "development"
}
```

---

## Roadmap

See [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) for the full module build order.

---

*Made with ❤️ using IBM Bob*
