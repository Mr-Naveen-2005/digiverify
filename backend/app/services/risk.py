"""Prototype risk scoring.

Combines document analysis, face similarity, cross-document consistency,
and OCR confidence into a 0-100 score. This is *not* a probability of
fraud — it is a prototype weighted aggregation.
"""
from __future__ import annotations

from dataclasses import dataclass

from ..schemas import (
    CrossDocumentResult,
    DocumentIndicators,
    FaceComparison,
    OcrData,
    RiskLevel,
)


@dataclass
class Signals:
    document: DocumentIndicators
    face: FaceComparison
    cross: CrossDocumentResult
    ocr: OcrData


def _document_score(d: DocumentIndicators) -> float:
    # anomaly_score 0-100 where 0 = pristine, 100 = highly anomalous
    return max(0.0, min(100.0, 100.0 - d.anomaly_score))


def _face_score(f: FaceComparison) -> float:
    if not f.available or f.similarity is None:
        return 60.0  # unknown — neutral
    return max(0.0, min(100.0, f.similarity))


def _cross_score(c: CrossDocumentResult) -> float:
    if not c.available or not c.compared:
        return 65.0  # not tested — slight neutral
    if c.mismatches:
        # Each mismatch is meaningful; cap at 50
        return max(20.0, 80.0 - 20.0 * len(c.mismatches))
    # compared and clean — full marks
    return 100.0


def _ocr_score(o: OcrData) -> float:
    confs = [
        f.confidence
        for f in (o.name, o.dob, o.document_number, o.gender, o.address)
        if f.confidence is not None
    ]
    if not confs:
        return 50.0  # nothing to measure
    avg = sum(confs) / len(confs)
    return max(0.0, min(100.0, avg * 100.0))


def compute(signals: Signals) -> tuple[int, RiskLevel]:
    """Return (score, level). Score 0-100, higher = safer."""
    parts = {
        "document": (_document_score(signals.document), 0.35),
        "face": (_face_score(signals.face), 0.30),
        "cross": (_cross_score(signals.cross), 0.20),
        "ocr": (_ocr_score(signals.ocr), 0.15),
    }
    score = sum(v * w for v, w in parts.values())
    score = max(0.0, min(100.0, score))
    score_int = int(round(score))

    if score_int >= 80:
        level: RiskLevel = "LOW"
    elif score_int >= 60:
        level = "REVIEW"
    else:
        level = "HIGH"

    return score_int, level
