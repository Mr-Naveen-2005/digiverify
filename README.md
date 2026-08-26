# DigiVerify — SIH First Version Prototype

> **Verify. Detect. Explain.**
>
> AI-assisted identity & document screening — a working first-version
> prototype for the Smart India Hackathon.

DigiVerify demonstrates the core verification workflow end-to-end:

```
Upload Document  →  Upload Photo  →  AI Analysis
   →  OCR Extraction  →  Document Screening  →  Face Comparison
        →  Risk Assessment  →  Explainable Result
```

The first version intentionally keeps scope small: **no auth, no admin
panel, no payments, no enterprise features.** The goal is for the core
AI workflow to actually work during a live demo.

---

## 1. Repository layout

```
digiverify/
├── frontend/                # Vite + React + TypeScript + Tailwind UI
│   ├── src/
│   │   ├── components/      # Layout, Dropzone
│   │   ├── pages/           # Home, Verify, Processing, Result
│   │   ├── services/        # API client
│   │   ├── types/           # Shared TypeScript types
│   │   └── utils/           # Formatting helpers
│   ├── index.html
│   ├── package.json
│   ├── tailwind.config.js
│   └── vite.config.ts
├── backend/                 # FastAPI service
│   ├── app/
│   │   ├── api/             # /api/analyze
│   │   ├── services/
│   │   │   ├── ocr/         # PaddleOCR (with safe fallback)
│   │   │   ├── vision/      # OpenCV indicator analysis
│   │   │   ├── face/        # InsightFace (with prototype fallback)
│   │   │   ├── gemini/      # Gemini explainer
│   │   │   ├── risk.py      # Risk aggregation
│   │   │   └── crossdoc.py  # Cross-document comparison
│   │   ├── schemas/         # Pydantic models
│   │   ├── config.py        # .env loader
│   │   └── main.py          # FastAPI app
│   ├── .env.example
│   └── requirements.txt
├── docs/                    # Architecture & demo notes
├── sample_data/             # SYNTHETIC demo data folder (do NOT commit real IDs)
├── uploads/                 # Temporary scratch (do not commit user data)
├── .env.example
└── README.md
```

---

## 2. Quick start (development)

### 2.1 Backend

```bash
cd backend
python -m venv .venv
# Windows:
.venv\Scripts\activate
# macOS / Linux:
source .venv/bin/activate

pip install -r requirements.txt
cp .env.example .env
# Edit .env and set GEMINI_API_KEY=...
uvicorn app.main:app --reload --port 8000
```

Backend will be available at <http://localhost:8000>.
Interactive docs: <http://localhost:8000/docs>.
Health check: <http://localhost:8000/api/health>.

> The first run downloads PaddleOCR and (if installed) InsightFace model
> weights. If those packages are not available, the services fall back
> gracefully so the demo still works.

### 2.2 Frontend

```bash
cd frontend
npm install
npm run dev
```

Frontend at <http://localhost:5173>. The Vite dev server proxies
`/api/*` to the FastAPI backend on port 8000.

---

## 3. The user journey

1. **Home** — hero, three capability cards, four-step "How it works",
   explanation of "Why is this suspicious?" USP, security notice.
2. **Verification** — drag-and-drop document upload + photo upload,
   verification-type selector, primary "Start AI Verification" button.
3. **Processing** — vertical timeline with eight real steps
   (upload → type → OCR → indicators → photo → face compare →
   risk → AI explanation). The progress reflects actual API work.
4. **Result** — circular prototype risk score, summary, four check
   cards, the highlighted "Why is this suspicious?" explanation
   panel, and an AI recommendation.

The result is built only from evidence the pipeline actually produced.
Gemini receives a structured evidence object — it never sees raw images
to "decide" if they are fake.

---

## 4. AI components

| Component | What it does | Fallback |
|---|---|---|
| **PaddleOCR** | Extracts text and identity fields. | Regex-based extractor on raw text. |
| **OpenCV (vision)** | Detects basic indicators: 8x8 block artefacts, region noise / colour mismatch, edge density, aspect ratio. | Returns "Could not decode image". |
| **InsightFace** | Embedding-based face similarity. | Prototype hash-based similarity + OpenCV face detection. Clearly labelled. |
| **Gemini 1.5 Flash** | Explains evidence using the supplied JSON. | Deterministic rule-based summary. |
| **Risk score** | Weighted aggregation (document 0.35, face 0.30, cross-doc 0.20, OCR 0.15). | Always available. |

The system is **explicitly a prototype** — scores and similarities are
labelled as such throughout the UI. Nothing here is a certified
biometric check.

---

## 5. Security basics

- `GEMINI_API_KEY` is read from `backend/.env` only — never sent to the
  browser.
- Uploaded file types and sizes are validated server-side.
- Filenames are never logged; raw OCR text is truncated before being
  sent to Gemini to limit payload size.
- No documents are persisted by default (only processed in memory).
- CORS is wide open in development — restrict for production.

---

## 6. Demo tips (SIH)

- Use **synthetic** sample documents (see `sample_data/`).
- Try a clean, frontal synthetic selfie against a matching document
  photo for a "LOW RISK" demo.
- Try a synthetic selfie that differs from the document photo (or
  upload two synthetic documents with different DOBs) to trigger
  "REVIEW" or "HIGH RISK" findings.
- The Gemini explainer needs `GEMINI_API_KEY`. Without it, the app
  still works using the rule-based fallback.

---

## 7. What this version is NOT

- It is not a production verification system.
- It does not prove fraud — it surfaces indicators.
- It does not integrate with government databases.
- It does not authenticate users or persist records.

See `docs/architecture.md` for a deeper walkthrough of how each
service composes into the final result.
