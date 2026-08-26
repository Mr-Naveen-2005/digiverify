"""DigiVerify FastAPI entry point."""
from __future__ import annotations

import logging
from pathlib import Path

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from .api.analyze import router as analyze_router
from .schemas import HealthResponse
from .services import face as face_service
from .services import ocr as ocr_service
from .services.gemini import client as gemini_client
from .config import settings

logger = logging.getLogger("digiverify")
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s %(levelname)s %(name)s: %(message)s",
)

app = FastAPI(
    title="DigiVerify API",
    description="AI-assisted identity & document screening prototype (SIH).",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(analyze_router, prefix="/api")


@app.get("/api/health", response_model=HealthResponse)
def health() -> HealthResponse:
    return HealthResponse(
        status="ok",
        gemini=settings.gemini_enabled,
        ocr=ocr_service.backend_name(),
        face=face_service.backend_name(),
    )


@app.exception_handler(Exception)
def unhandled(_request, exc: Exception):  # pragma: no cover
    logger.exception("Unhandled error: %s", exc)
    return JSONResponse(
        status_code=500,
        content={"detail": "Internal server error. Please try again."},
    )
