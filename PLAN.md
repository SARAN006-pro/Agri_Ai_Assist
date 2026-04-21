# SmartFarm AI Backend — Implementation Plan

## 1. Recommended Stack

- **Framework**: FastAPI (lightweight, async, auto-docs, easy deployment)
- **Language**: Python 3.11+
- **Database**: SQLite via `aiosqlite` (zero-config, single file, persistent)
- **AI Integration**: OpenRouter API (Mistral 7B) — existing requirement
- **Storage**: Local filesystem (SQLite DB, RAG embeddings, session data)
- **Hosting**: Render (free tier compatible, Python native)

---

## 2. Final Folder Structure

```
backend/
├── app/
│   ├── __init__.py
│   ├── main.py              # FastAPI app, CORS, lifespan
│   ├── config.py            # Env var loading, settings
│   ├── database.py          # SQLite connection + init
│   ├── routes/
│   │   ├── __init__.py
│   │   ├── chat.py          # /chat, /chat/sessions, /chat/export, /chat/context
│   │   ├── rag.py          # /rag/upload, /rag/query, /rag/stats
│   │   ├── predict.py      # /predict/crop, /predict/yield, /predict/crops/list
│   │   ├── stats.py        # /stats, /stats/history, /stats/breakdown
│   │   ├── settings.py      # /settings, /settings/reset-index, /settings/clear-history
│   │   ├── farm.py         # /farm/profile (CRUD)
│   │   ├── market.py       # /market/prices, /market/prices/{crop}
│   │   ├── irrigation.py   # /irrigation/advice, /irrigation/logs
│   │   ├── economics.py    # /economics/margin
│   │   ├── calendar.py     # /calendar, /calendar/crops/list
│   │   ├── records.py      # /records (CRUD)
│   │   ├── sensors.py      # /sensors/readings, /sensors/webhook-url, /sensors/data
│   │   ├── translation.py  # /translate, /detect-language, /languages
│   │   └── profile.py      # /feedback, /correction, /crop-outcome, /profile/*, /profile/{deviceId}/*
│   ├── services/
│   │   ├── __init__.py
│   │   ├── chat_service.py     # Chat logic + OpenRouter
│   │   ├── rag_service.py      # RAG logic (embedding + search)
│   │   ├── ml_service.py       # Crop/yield prediction (rule-based + lightweight ML)
│   │   ├── irrigation_service.py
│   │   ├── economics_service.py
│   │   └── calendar_service.py
│   └── utils/
│       ├── __init__.py
│       └── helpers.py          # UUID gen, date utils
├── data/                       # SQLite DB + RAG store
├── uploads/                    # Uploaded documents for RAG
├── requirements.txt
├── .env.example
├── Dockerfile
├── Dockerfile起身            # Multi-stage for smaller image
├── render.yaml                 # Render deployment config
└── README.md
```

---

## 3. Implementation Steps

### Step 1 — Project scaffolding

- Create `requirements.txt` with minimal deps: `fastapi`, `uvicorn[standard]`, `aiosqlite`, `python-multipart`, `openrouter-python`, `httpx`
- Create `config.py` — env var loading with Pydantic settings
- Create `database.py` — async SQLite init with `aiosqlite`
- Create `app/main.py` — FastAPI app with CORS, lifespan, health endpoint
- Create `app/routes/__init__.py`

### Step 2 — Core routes (all 40+ endpoints)

Implement each route group as a separate router file:

**Chat** (`chat.py`):

- `POST /chat` → OpenRouter AI reply, store in session history
- `GET /chat/history/{session_id}` → return message array
- `GET /chat/sessions` → list sessions
- `POST /chat/sessions` → create session
- `DELETE /chat/sessions/{session_id}`
- `PATCH /chat/sessions/{session_id}` → rename
- `GET /chat/export/{session_id}?format=json|csv|pdf` → file download
- `GET /chat/context/{session_id}?device_id=` → adaptive learning context

**RAG** (`rag.py`):

- `POST /rag/upload` → save file, chunk, store embeddings (simple file-based vector store)
- `POST /rag/query` → semantic search + OpenRouter answer synthesis
- `GET /rag/stats` → document/chunk counts

**Predict** (`predict.py`):

- `POST /predict/crop` → rule-based + simple sklearn model
- `POST /predict/yield` → formula-based yield estimation
- `GET /predict/crops/list` → static crop list

**Stats** (`stats.py`):

- `GET /stats` → total counts
- `GET /stats/history` → 7-day activity
- `GET /stats/breakdown` → event type breakdown

**Settings** (`settings.py`):

- `GET /settings` → app config
- `POST /settings/reset-index`
- `POST /settings/clear-history`

**Farm** (`farm.py`): CRUD `/farm/profile`
**Market** (`market.py`): `/market/prices`, `/market/prices/{crop}` (static mock data)
**Irrigation** (`irrigation.py`): `/irrigation/advice`, `/irrigation/logs`
**Economics** (`economics.py`): `/economics/margin`
**Calendar** (`calendar.py`): `/calendar`, `/calendar/crops/list`
**Records** (`records.py`): CRUD `/records`
**Sensors** (`sensors.py`): `/sensors/readings`, `/sensors/webhook-url`, `/sensors/data`
**Translation** (`translation.py`): `/translate`, `/detect-language`, `/languages`
**Profile** (`profile.py`): `/feedback`, `/correction`, `/crop-outcome`, `/profile/{deviceId}/*`

### Step 3 — Services layer

- `chat_service.py` — OpenRouter API call, session management, prompt construction
- `rag_service.py` — File chunking (simple text split), file-based "vector store" (no heavy FAISS), query-time search
- `ml_service.py` — Crop recommendation (pre-trained sklearn model, <1MB), yield prediction formula
- `irrigation_service.py` — urgency calculation from soil moisture + crop + conditions
- `economics_service.py` — profit margin calculation
- `calendar_service.py` — static crop calendar data

### Step 4 — Database schema

SQLite tables:

- `chat_sessions` (id, session_id, name, created_at)
- `chat_messages` (id, session_id, role, content, created_at)
- `farm_profiles` (id, name, location, soil_type, acreage, crops_grown, created_at)
- `yield_records` (id, crop, year, yield_kg_per_ha, area_ha, notes, created_at)
- `sensor_readings` (id, sensor_type, value, unit, farm_id, timestamp)
- `irrigation_logs` (id, crop, moisture_level, urgency, recommended_action, created_at)
- `user_profiles` (device_id PRIMARY KEY, preferences_json, created_at, updated_at)
- `learning_stats` (device_id, total_feedback, total_corrections, total_crop_outcomes, updated_at)
- `crop_outcomes` (id, device_id, crop, outcome, yield_kg_per_ha, year, notes, created_at)
- `personalized_context` (device_id, key, value, created_at)
- `stats_daily` (date PRIMARY KEY, chats, predictions, uploads)

### Step 5 — Production config

- `render.yaml` — Render deployment config
- `Dockerfile` — Python slim image
- `.env.example` — all required vars documented
- `requirements.txt` — pinned minimal deps

---

## 4. Key Design Decisions

1. **SQLite over PostgreSQL**: Zero config, no external DB needed, survives restarts
2. **File-based RAG over FAISS**: Skip heavy sentence-transformers + FAISS stack; use simple TF-IDF + keyword search to avoid GB downloads
3. **Rule-based crop prediction**: Pre-train ONE sklearn model offline, ship as pickle (<1MB); no training at runtime
4. **No authentication middleware**: Device ID is the identifier; backend is firewalled to trusted clients only
5. **No background workers**: All async operations are handled inline; scheduled tasks use cron on Render free tier
6. **No Redis/cache**: SQLite + in-memory caching for stats counters

---

## 5. Deployment Plan

1. Push backend to a GitHub repo
2. Connect repo to Render (or use existing deploy repo from memory: `Agri_Ai_Assist`)
3. Set env vars (`OPENROUTER_API_KEY`, etc.)
4. Deploy — Render auto-detects FastAPI from `main.py`
5. Set `VITE_API_URL` in frontend env to the Render URL
6. Build and deploy frontend

---

## 6. Frontend Integration Notes

- `VITE_API_URL` must be set in frontend production build to backend URL
- No code changes needed in frontend
- All 40+ endpoints must return exact shapes the frontend expects (documented in API analysis)
- Chat endpoint calls OpenRouter — requires valid `OPENROUTER_API_KEY`
- RAG upload/download uses filesystem — requires `uploads/` dir writable
