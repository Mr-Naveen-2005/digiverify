"""POST /api/analyze — orchestrates the full verification pipeline."""
from __future__ import annotations

import logging
from datetime import datetime, timezone
from typing import List

from fastapi import APIRouter, File, Form, HTTPException, UploadFile

from ..config import settings
from ..schemas import AnalyzeResponse
from ..services import crossdoc, face, ocr, vision
from ..services.gemini import client as gemini_client
from ..services.risk import Signals, compute

logger = logging.getLogger("digiverify.api")

router = APIRouter()

ALLOWED_TYPES = {"image/jpeg", "image/png", "image/jpg", "application/pdf"}


def _check_upload(file: UploadFile | None, name: str) -> None:
    if file is None:
        raise HTTPException(status_code=400, detail=f"Please upload {name}.")
    if not file.content_type or file.content_type not in ALLOWED_TYPES:
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported file type for {name}. Use JPG, PNG, or PDF.",
        )


async def _read_with_limit(file: UploadFile, limit: int) -> bytes:
    data = await file.read()
    if len(data) > limit:
        raise HTTPException(status_code=400, detail="File is too large (max 10 MB).")
    return data


@router.post("/analyze", response_model=AnalyzeResponse)
async def analyze(
    document: UploadFile = File(..., description="Identity document (image/PDF)"),
    photo: UploadFile = File(..., description="Selfie/photo (image)"),
    verification_type: str = Form("General Identity Verification"),
    extra_documents: List[UploadFile] = File(default_factory=list),
) -> AnalyzeResponse:
    _check_upload(document, "identity document")
    _check_upload(photo, "photo")

    doc_bytes = await _read_with_limit(document, settings.max_upload_bytes)
    photo_bytes = await _read_with_limit(photo, settings.max_upload_bytes)

    extra_ocrs = []
    for f in extra_documents or []:
        _check_upload(f, "extra document")
        data = await _read_with_limit(f, settings.max_upload_bytes)
        try:
            extra_ocrs.append(ocr.extract(data))
        except Exception:
            logger.warning("Extra document OCR failed", exc_info=True)

    # 1) OCR
    try:
        primary_ocr = ocr.extract(doc_bytes)
    except Exception as exc:
        logger.warning("OCR failed: %s", exc)
        from ..schemas import OcrData

        primary_ocr = OcrData()

    # 2) Document visual analysis
    try:
        indicators = vision.analyze(doc_bytes)
    except Exception as exc:
        logger.warning("Vision analysis failed: %s", exc)
        from ..schemas import DocumentIndicators

        indicators = DocumentIndicators(
            indicators=["Visual analysis could not be completed."],
            anomaly_score=0.0,
        )

    # 3) Face comparison
    try:
        face_result = face.compare(doc_bytes, photo_bytes)
    except Exception as exc:
        logger.warning("Face comparison failed: %s", exc)
        from ..schemas import FaceComparison

        face_result = FaceComparison(
            available=False,
            message="Face comparison could not be completed.",
        )

    # 4) Cross-document
    try:
        cross = crossdoc.compare(primary_ocr, extra_ocrs)
    except Exception as exc:
        logger.warning("Cross-doc failed: %s", exc)
        from ..schemas import CrossDocumentResult

        cross = CrossDocumentResult(message="Cross-document comparison could not be completed.")

    # 5) Risk
    signals = Signals(
        document=indicators,
        face=face_result,
        cross=cross,
        ocr=primary_ocr,
    )
    score, level = compute(signals)

    # 6) Document type — best-effort label from OCR text
    document_type = _guess_document_type(primary_ocr.raw_text)

    # 7) Gemini explanation
    evidence = {
        "document_type": document_type,
        "verification_type": verification_type,
        "ocr": {
            "name": primary_ocr.name.value,
            "dob": primary_ocr.dob.value,
            "document_number": primary_ocr.document_number.value,
            "gender": primary_ocr.gender.value,
            "address": primary_ocr.address.value,
        },
        "document_indicators": {
            "anomaly_score": indicators.anomaly_score,
            "indicators": indicators.indicators,
            "notes": indicators.notes,
        },
        "face_similarity": {
            "available": face_result.available,
            "similarity": face_result.similarity,
            "status": face_result.status,
        },
        "cross_document": {
            "available": cross.available,
            "compared": cross.compared,
            "matches": cross.matches,
            "mismatches": cross.mismatches,
        },
        "risk_score": score,
        "risk_level": level,
    }
    try:
        explanation = gemini_client.explain(evidence, fallback_level=level)
    except Exception as exc:
        logger.warning("Gemini explain failed: %s", exc)
        from ..schemas import AiExplanation

        explanation = AiExplanation(
            risk_level=level,
            summary="AI explanation is temporarily unavailable.",
            recommendation="Manual review is recommended.",
            source="fallback",
        )

    return AnalyzeResponse(
        document_type=document_type,
        verification_type=verification_type,
        ocr=primary_ocr,
        document_indicators=indicators,
        face_similarity=face_result,
        cross_document=cross,
        risk_score=score,
        risk_level=level,
        ai_explanation=explanation,
        generated_at=datetime.now(timezone.utc).isoformat(),
    )


def _guess_document_type(text: str) -> str:
    t = (text or "").lower()
    if "passport" in t:
        return "Passport"
    if "aadhaar" in t or "uidai" in t:
        return "Aadhaar Card"
    if "driver" in t and "license" in t:
        return "Driver's License"
    if "pan" in t and "card" in t:
        return "PAN Card"
    if "voter" in t or "election" in t:
        return "Voter ID"
    if "national id" in t or "identity card" in t:
        return "National ID"
    return "Identity Document"
