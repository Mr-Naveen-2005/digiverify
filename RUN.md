# DigiVerify — Run & Deploy Guide

This file covers everything you need to run DigiVerify locally and
push the project to a new Git repository.

---

## 1. Prerequisites

| Tool   | Version      | Notes                                            |
|--------|--------------|--------------------------------------------------|
| Python | 3.11 or 3.12 | 3.13 works but skips PaddleOCR (regex fallback). |
| Node   | 18 or newer  | For the Vite/React frontend.                     |
| Git    | 2.30+        | For version control.                             |

---

## 2. First-time setup

Run these once after cloning the repository.

### 2.1 Backend

```bash
cd backend
python -m venv .venv

# Activate the venv.
# Windows (Git Bash / PowerShell):
source .venv/Scripts/activate
# macOS / Linux:
source .venv/bin/activate

pip install -r requirements.txt
```

Create `backend/.env` (or copy from `backend/.env.example`):

```env
GEMINI_API_KEY=your_real_key_here
GEMINI_MODEL=gemini-3.6-flash
APP_ENV=development
MAX_UPLOAD_MB=10
```

Get a Gemini key from <https://aistudio.google.com/apikey>.
> Models rotate frequently. If you get a `404 models/... is not found`
> error, run `python -c "import google.generativeai as g; g.configure(api_key='KEY'); [print(m.name) for m in g.list_models() if 'generateContent' in (m.supported_generation_methods or [])]"`
> and pick a current `gemini-X-flash` model.

### 2.2 Frontend

```bash
cd frontend
npm install
```

`frontend/.env` is optional. The default `VITE_API_BASE=/api` works
for local dev because `vite.config.ts` proxies `/api` to
`http://localhost:8000`.

---

## 3. Running locally

You need **two terminals** — one for the backend, one for the frontend.

### Terminal 1 — backend

```bash
cd backend
source .venv/Scripts/activate     # or .venv\Scripts\activate on cmd
uvicorn app.main:app --reload --port 8000
```

- API: <http://localhost:8000>
- Interactive docs: <http://localhost:8000/docs>
- Health check: <http://localhost:8000/api/health>

### Terminal 2 — frontend

```bash
cd frontend
npm run dev
```

- UI: <http://localhost:5173>

The Vite dev server proxies `/api/*` to the FastAPI backend on
port 8000 — no CORS issues in development.

### Stopping the app

- Frontend: `Ctrl+C` in terminal 2
- Backend: `Ctrl+C` in terminal 1

---

## 4. Common issues

| Symptom | Cause | Fix |
|---|---|---|
| `ECONNREFUSED ... /api/analyze` | Backend not running | Start uvicorn in terminal 1 |
| `(Gemini error: 404 ... is not found)` | Model retired | Update `GEMINI_MODEL` in `backend/.env` |
| `RiskLeve ... not defined` on startup | Stale code | Already fixed in this repo — `git pull` |
| Frontend spins forever on "Combining evidence" | Gemini call hanging | Already mitigated — 15s timeout wrapper around Gemini call |
| OCR returns empty | PaddleOCR not installed | Install full requirements, or accept regex fallback |

---

## 5. Pushing to a new Git repository

### 5.1 Create an empty repo on GitHub / GitLab / Gitea

1. Visit your Git host and click **New repository**.
2. Name it (e.g. `digiverify`).
3. **Do not** initialize it with README, license, or .gitignore — you
   already have those.
4. Copy the remote URL (e.g.
   `https://github.com/<your-username>/digiverify.git`).

### 5.2 Initialize and push from this folder

> The folder `D:\Careers\SIH\digiverify` is **not yet a git repo**.
> The commands below turn it into one and push everything except
> the secrets and build artefacts (already covered by `.gitignore`).

```bash
# From the project root:
cd "D:/Careers/SIH/digiverify"

# 1. Initialize
git init
git branch -M main

# 2. Stage everything (respects .gitignore)
git add .

# 3. Verify what will be committed — MUST NOT include:
#    - backend/.env
#    - backend/.venv/
#    - frontend/node_modules/
#    - uploads/ contents
git status

# 4. First commit
git commit -m "Initial DigiVerify SIH prototype"

# 5. Connect to your remote
git remote add origin https://github.com/<your-username>/digiverify.git

# 6. Push
git push -u origin main
```

### 5.3 Day-to-day git workflow

```bash
git status                       # see what changed
git add <file-or-folder>         # stage
git commit -m "Describe change"  # commit
git push                         # send to remote
```

### 5.4 If you accidentally committed a secret

The `.gitignore` already excludes `.env`, but if a key was committed:

```bash
# Rotate the key first (Google AI Studio > API keys > Revoke)
# Then scrub history:
git filter-repo --invert-paths --path backend/.env
git push --force
```

Or use BFG Repo-Cleaner: `bfg --delete-files .env`.

---

## 6. Production hosting (optional)

Vercel hosts the **frontend only**. The backend needs a long-running
Python process — use Render, Railway, Fly.io, or a VPS.

### Frontend on Vercel

1. Import the repo into Vercel.
2. Set **Root Directory** = `frontend`.
3. Set env var: `VITE_API_BASE=https://your-backend-url/api`.
4. Deploy. Vercel auto-detects Vite.

### Backend on Render

1. New Web Service → connect repo.
2. **Root Directory** = `backend`.
3. Build: `pip install -r requirements.txt`.
4. Start: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`.
5. Add `GEMINI_API_KEY` and `GEMINI_MODEL` env vars.
6. After first deploy, update the Vercel env var with the Render URL.

### CORS for production

`backend/app/main.py` currently allows all origins. Tighten before
launching publicly:

```python
app.add_middleware(
    CORSMiddleware,
    allow_origins=["https://your-app.vercel.app"],
    allow_methods=["*"],
    allow_headers=["*"],
)
```

---

## 7. Useful one-liners

```bash
# Reset the backend (kills any uvicorn, removes caches)
pkill -f "uvicorn app.main" ; rm -rf backend/app/__pycache__ backend/app/*/__pycache__

# Run only the backend test
curl -X POST http://localhost:8000/api/health

# Tail backend logs if running in background
tail -f /tmp/uvicorn.log
```
