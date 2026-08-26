# Architecture

## High level

```
[Frontend (Vite/React)]
   │  POST /api/analyze  (multipart: document, photo, extra_documents, verification_type)
   ▼
[FastAPI router]
   │
   ├── OCR service        (PaddleOCR → fallback regex)
   ├── Vision service     (OpenCV indicator analysis)
   ├── Face service       (InsightFace → prototype similarity)
   ├── Cross-doc service  (compare primary OCR vs extras)
   ├── Risk service       (weighted 0-100 score)
   └── Gemini service     (evidence-grounded explanation)
   │
   ▼
[AnalyzeResponse JSON]
```

## Why evidence-grounded AI

The Gemini prompt is given a **structured evidence object** (not raw
images). The model is asked to:

1. Use the provided evidence only.
2. Return strict JSON in a known schema.
3. Describe findings in terms of indicators, never as "confirmed fake".

This is the core "Why is this suspicious?" guarantee: the explanation
is always traceable to evidence the system itself collected.

## Why weighted aggregation, not a single ML model

A single end-to-end model would not be feasible in the available time
and would be hard to explain. Instead, the system combines several
small, interpretable signals with explicit weights. The risk service
exposes those weights so the UI can show *why* a score is what it is.

## Why prototype face similarity

InsightFace is the production-quality option but adds heavy
dependencies (onnxruntime, gdown model download). The fallback
service uses OpenCV's Haar cascade for face detection plus a hashed
perceptual similarity. The UI always shows "Prototype face
similarity — not a certified biometric check" so reviewers are not
misled.

## Extending later

- Swap the hash-based similarity for any embedding model.
- Add an `extra_documents` upload to the front-end for full
  cross-document flows.
- Persist results to a DB once a real schema is decided.
