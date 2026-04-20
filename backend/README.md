# SmartFarm AI — Backend

FastAPI backend for SmartFarm AI. Powers crop recommendation, yield prediction,
chat, RAG document Q&A, irrigation advice, and all farmer-facing features.

## Tech Stack

- **FastAPI** — async Python web framework
- **SQLite** (via `aiosqlite`) — zero-config persistent storage
- **OpenRouter API** — Mistral 7B via OpenRouter (free tier compatible)
- **Uvicorn** — ASGI server

## Quick Start

### 1. Install dependencies

```bash
cd backend
pip install -r requirements.txt
```

### 2. Configure environment

Copy `.env.example` to `.env` and fill in your `OPENROUTER_API_KEY`:

```bash
cp .env.example .env
# Edit .env and set OPENROUTER_API_KEY
```

### 3. Run

```bash
python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

The server starts at **http://localhost:8000**. API docs are at **http://localhost:8000/docs**.

## Frontend Integration

In development, the Vite proxy (`/api` → `http://localhost:8000`) handles routing automatically.

For production, set the `VITE_API_BASE_URL` environment variable in your frontend build to your deployed backend URL (e.g. `https://smartfarm-api.onrender.com`).

## Environment Variables

| Variable | Required | Default | Description |
|---|---|---|---|
| `OPENROUTER_API_KEY` | **Yes** | — | OpenRouter API key from https://openrouter.ai |
| `MODEL_NAME` | No | `mistralai/mistral-7b-instruct` | OpenRouter model |
| `PORT` | No | `8000` | Server port |
| `FRONTEND_URL` | No | `http://localhost:5173` | Frontend origin for CORS |
| `DB_PATH` | No | `data/smartfarm.db` | SQLite database path |
| `UPLOAD_DIR` | No | `uploads/` | Directory for RAG document uploads |

## Deployment to Render (Free Tier)

1. Push this `backend/` directory to a GitHub repo.
2. Create a **Web Service** on [Render](https://render.com).
3. Connect your repo and set:
   - **Root Directory**: `backend`
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `python -m uvicorn app.main:app --host 0.0.0.0 --port 8000`
4. Add environment variables from `.env.example` in the Render dashboard.
5. (Optional) Attach a Render Persistent Disk (`/data`) and set `DB_PATH=/data/smartfarm.db` to persist data across deploys.

## Deployment to Railway

1. New Project → Deploy from GitHub repo (select `backend/` subdirectory).
2. Set root directory to `backend`.
3. Add environment variables from `.env.example`.
4. Railway auto-detects Python and runs `pip install -r requirements.txt`.

## API Endpoints

All endpoints are prefixed with `/api`.

| Method | Path | Description |
|---|---|---|
| POST | `/chat` | Chat with AI |
| GET | `/chat/history/{session_id}` | Get chat history |
| GET | `/chat/sessions` | List chat sessions |
| POST | `/chat/sessions` | Create session |
| DELETE | `/chat/sessions/{session_id}` | Delete session |
| PATCH | `/chat/sessions/{session_id}` | Rename session |
| GET | `/chat/export/{session_id}` | Export chat (json/csv) |
| POST | `/rag/upload` | Upload document (PDF/TXT/MD) |
| POST | `/rag/query` | Query uploaded documents |
| GET | `/rag/stats` | RAG index stats |
| POST | `/predict/crop` | Recommend crop |
| POST | `/predict/yield` | Estimate yield |
| GET | `/predict/crops/list` | Available crops |
| GET | `/stats` | Usage statistics |
| GET | `/stats/history` | 7-day activity |
| GET | `/stats/breakdown` | Event breakdown |
| GET | `/settings` | App settings |
| POST | `/settings/reset-index` | Clear RAG index |
| POST | `/settings/clear-history` | Clear all chat |
| GET/POST/PUT/DELETE | `/farm/profile` | Farm profile CRUD |
| GET | `/market/prices` | Market prices |
| GET | `/market/prices/{crop}` | Filter by crop |
| POST | `/irrigation/advice` | Irrigation advice |
| GET | `/irrigation/logs` | Irrigation history |
| POST | `/economics/margin` | Profit margin calculator |
| GET | `/calendar` | Crop calendar |
| GET | `/calendar/crops/list` | Calendar crops |
| GET/POST/PUT/DELETE | `/records` | Yield records CRUD |
| GET | `/sensors/readings` | Sensor readings |
| POST | `/sensors/data` | Submit sensor reading |
| POST | `/translate` | Translate text |
| POST | `/detect-language` | Detect language |
| GET | `/languages` | Supported languages |
| POST | `/feedback` | Submit feedback |
| POST | `/correction` | Submit correction |
| POST | `/crop-outcome` | Record crop outcome |
| GET | `/profile/{device_id}` | User profile |
| GET | `/profile/{device_id}/stats` | Learning stats |
| GET | `/profile/{device_id}/context` | Personalized context |
| POST | `/profile/{device_id}/context` | Add to context |
| GET | `/profile/{device_id}/crop-patterns` | Crop patterns |

## Database

SQLite is auto-initialised on first run. Tables created:

- `chat_sessions`, `chat_messages`
- `farm_profiles`, `yield_records`
- `sensor_readings`, `irrigation_logs`
- `user_profiles`, `learning_stats`, `crop_outcomes`
- `personalized_context`, `stats_daily`
- `user_feedback`, `rag_documents`
