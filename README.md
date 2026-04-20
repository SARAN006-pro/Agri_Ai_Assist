# SmartFarm AI Copilot

AI-powered agriculture assistant with chat, crop recommendations, yield prediction, and document Q&A.

## Features

- **AI Chat** — Ask farming questions and get expert answers via OpenRouter
- **Crop Advisor** — Enter soil/climate data for AI crop recommendations (local ML model)
- **Yield Predictor** — Estimate harvest based on farm parameters (local ML model)
- **Document Q&A** — Upload farming guides (PDF/TXT/MD) and query them with AI
- **Dashboard** — Activity overview with 7-day usage stats and knowledge base status

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18, Vite, Tailwind CSS v4, Recharts |
| Backend | FastAPI, Python |
| AI | OpenRouter API (Mistral 7B by default) |
| Local ML | scikit-learn (RandomForest + GradientBoosting) |
| RAG | sentence-transformers, FAISS |
| Database | SQLite |

## Prerequisites

- Python 3.10+
- Node.js 18+
- OpenRouter API key (optional — app runs in demo mode without it)

## Quick Start

### 1. Install dependencies

```bash
# Root tooling (for concurrently dev runner)
npm install

# Backend
cd backend
pip install -r requirements.txt
cd ..

# Frontend
cd frontend
npm install
cd ..
```

### 2. Configure environment

```bash
cp backend/.env.example backend/.env.local
# Edit backend/.env.local and add your OPENROUTER_API_KEY
```

### 3. Run

**Both servers at once:**
```bash
npm run dev
```

**Or separately:**
```bash
# Terminal 1 — backend
cd backend && uvicorn app.main:app --reload --port 8000

# Terminal 2 — frontend
cd frontend && npm run dev
```

- Frontend: http://localhost:5173
- Backend API: http://localhost:8000
- API docs: http://localhost:8000/docs

### 4. Train ML models (first run)

Models train automatically on first startup. To manually train:

```bash
cd backend && python -m app.ml.train_models
```

## Environment Variables

| Variable | Default | Description |
|---|---|---|
| `OPENROUTER_API_KEY` | _(empty)_ | API key from openrouter.ai. Required for real AI responses. |
| `MODEL_NAME` | `mistralai/mistral-7b-instruct` | OpenRouter model to use |
| `DATA_DIR` | _(backend dir)_ | Directory for database, RAG store, ML models, and uploads |

## API Endpoints

| Method | Path | Description |
|---|---|---|
| GET | `/` | Health check |
| POST | `/api/chat` | Send a chat message |
| GET | `/api/chat/history/{session_id}` | Get chat history |
| POST | `/api/predict/crop` | Get crop recommendation |
| POST | `/api/predict/yield` | Predict yield |
| GET | `/api/predict/crops/list` | List supported crops |
| POST | `/api/rag/upload` | Upload a PDF/TXT/MD document |
| POST | `/api/rag/query` | Ask a question about uploaded docs |
| GET | `/api/rag/stats` | RAG index statistics |
| DELETE | `/api/rag/reset` | Clear the RAG index |
| GET | `/api/stats` | Dashboard counts |
| GET | `/api/stats/history` | 7-day activity history |
| GET | `/api/stats/breakdown` | Usage breakdown by type |

## Project Structure

```
smartfarm-ai/
├── backend/
│   ├── app/
│   │   ├── api/          # FastAPI route modules (chat, predict, rag)
│   │   ├── ml/           # ML models (crop, yield, training)
│   │   ├── rag/          # Document embedding and search (FAISS)
│   │   ├── schemas/      # Pydantic request/response models
│   │   ├── services/     # Business logic (chat, ml, rag)
│   │   ├── utils/        # Database helpers (SQLite)
│   │   └── main.py       # FastAPI app entry point
│   ├── requirements.txt
│   └── .env
├── frontend/
│   ├── src/
│   │   ├── components/   # Sidebar, TopBar, StatCard
│   │   ├── pages/        # Dashboard, Chat, Recommend, Analytics, Settings, Landing
│   │   ├── services/      # API client (axios)
│   │   ├── App.jsx       # Router setup
│   │   ├── main.jsx
│   │   └── index.css
│   ├── index.html
│   ├── package.json
│   └── vite.config.js
├── package.json           # Root scripts (concurrently dev runner)
├── vite.config.js        # Frontend Vite config with /api proxy
├── CLAUDE.md             # Developer context
└── README.md
```