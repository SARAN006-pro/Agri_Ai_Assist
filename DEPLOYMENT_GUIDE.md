# SmartFarm AI — Deployment Guide

## Architecture

```
Frontend (Netlify)          Backend (Render)              Supabase
https://agriintel-ai.netlify.app  →  https://ai-farm-assist.onrender.com  →  Postgres
                                   (FastAPI + Uvicorn)          (Persistent DB)
                                   ↑ DATABASE_URL
```

---

## Part 1 — Supabase Database Setup

### 1.1 Get your Supabase connection string

1. Go to [supabase.com](https://supabase.com) → your project
2. Go to **Settings → Database**
3. Copy the **Connection string** (URI format, not the Pooled one)
   ```
   postgresql://postgres:<YOUR_PASSWORD>@db.xxxxx.supabase.co:5432/postgres
   ```
4. **URL-encode** any special characters in your password (e.g. `@` → `%40`)
   - Your password: `machimassu006@`
   - Encoded: `machimassu006%40`

### 1.2 Run the database schema

1. Go to **SQL Editor** in Supabase dashboard
2. Create a **new query** and paste the contents of:
   ```
   backend/supabase/migrations/001_initial_schema.sql
   ```
3. Click **Run** — this creates all 13 tables

---

## Part 2 — Backend Deployment (Render + Supabase)

### 2.1 Create a Render account
- Go to [render.com](https://render.com)
- Connect your GitHub account
- Click **New → Web Service**

### 2.2 Configure the backend
| Setting | Value |
|---------|-------|
| **GitHub repo** | `SARAN006-pro/Ai_Farm_Assist` |
| **Root Directory** | `backend` |
| **Build Command** | `pip install -r requirements.txt` |
| **Start Command** | `python -m uvicorn app.main:app --host 0.0.0.0 --port 8000` |
| **Plan** | Free |

### 2.3 Add environment variables

In Render dashboard → Environment tab, add these:

| Key | Value | Notes |
|-----|-------|-------|
| `DATABASE_URL` | `postgresql://postgres:machimassu006%40@db.inhcmoaisqokdhgggdsw.supabase.co:5432/postgres` | Your URL-encoded password |
| `OPENROUTER_API_KEY` | `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` | Get from openrouter.ai |
| `MODEL_NAME` | `google/gemma-3-4b-it:free` | High-perf free model |
| `FRONTEND_URL` | `https://agriintel-ai.netlify.app` | Your Netlify URL |
| `DB_PATH` | `data/smartfarm.db` | Default — can keep |
| `UPLOAD_DIR` | `uploads` | Default — can keep |

### 2.4 Deploy
- Click **Create Web Service**
- Render will automatically build and deploy
- Wait ~2-3 minutes for first deploy
- Your backend will be live at: `https://ai-farm-assist-xxxx.onrender.com`

### 2.5 Verify backend is running
- Visit: `https://ai-farm-assist-xxxx.onrender.com/health`
- Should return: `{"status":"ok"}`

---

## Part 3 — Frontend Deployment (Netlify)

### 3.1 Update the API URL

Before deploying, update `frontend/src/services/api.js` to point to your **new Render backend URL** (not the old `ai-farm-assist-js7f.onrender.com`).

The current `api.js` uses `import.meta.env.VITE_API_URL` — set this in Netlify:

### 3.2 Deploy to Netlify

1. Go to [netlify.com](https://netlify.com)
2. Click **Add new site → Import an existing project**
3. Connect your GitHub repo `SARAN006-pro/Ai_Farm_Assist`
4. Set **Root directory:** `frontend`
5. Set **Build command:** `npm run build`
6. Set **Publish directory:** `dist`

### 3.3 Add environment variable

In Netlify dashboard → Site settings → Environment variables:

| Key | Value |
|-----|-------|
| `VITE_API_URL` | `https://ai-farm-assist-xxxx.onrender.com` |

Replace `xxxx` with your actual Render subdomain.

### 3.4 Deploy
- Click **Deploy site**
- Netlify will build and deploy
- Your frontend will be live at: `https://agriintel-ai.netlify.app`

---

## Part 4 — Verify Everything Works

### Test the backend API directly:
```bash
curl https://ai-farm-assist-xxxx.onrender.com/api/stats
```

### Test CORS from frontend origin:
```bash
curl https://ai-farm-assist-xxxx.onrender.com/api/stats \
  -H "Origin: https://agriintel-ai.netlify.app"
```
Should return JSON with `access-control-allow-credentials: true` header.

### Test chat in the browser:
1. Open `https://agriintel-ai.netlify.app`
2. Go to Chat page
3. Send a message — you should get an AI response

---

## Troubleshooting

### "Unable to reach the backend"
- Check browser console (F12) for the exact error
- Verify `VITE_API_URL` in Netlify matches your Render URL exactly
- Test Render health: `https://your-render-url.onrender.com/health`

### "401 Unauthorized" from OpenRouter
- Your API key may be expired or invalid
- Get a new key at [openrouter.ai/keys](https://openrouter.ai/keys)
- Update `OPENROUTER_API_KEY` in Render dashboard

### Database connection errors
- Verify `DATABASE_URL` is correctly URL-encoded
- Test connection from Supabase SQL Editor first
- Make sure Supabase project is not paused (free tier suspends after inactivity)

### CORS errors in browser
- Verify `FRONTEND_URL` in Render matches exactly: `https://agriintel-ai.netlify.app`
- Must include `https://` and no trailing slash

---

## Environment Variable Reference

### Render Backend
| Variable | Example Value |
|----------|--------------|
| `DATABASE_URL` | `postgresql://postgres:machimassu006%40@db.inhcmoaisqokdhgggdsw.supabase.co:5432/postgres` |
| `OPENROUTER_API_KEY` | `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` |
| `MODEL_NAME` | `google/gemma-3-4b-it:free` |
| `FRONTEND_URL` | `https://agriintel-ai.netlify.app` |
| `PORT` | `8000` |
| `DB_PATH` | `data/smartfarm.db` |
| `UPLOAD_DIR` | `uploads` |

### Netlify Frontend
| Variable | Value |
|----------|-------|
| `VITE_API_URL` | `https://ai-farm-assist-xxxx.onrender.com` |
