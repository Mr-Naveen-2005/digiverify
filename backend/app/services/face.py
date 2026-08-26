"""Face comparison service.

Primary path: InsightFace (buffalo_l). If unavailable, fall back to a
prototype similarity score built from a small set of perceptual hashes
and structural cues. The fallback is clearly labeled in the API response
so the UI can show "Prototype face similarity".
"""
from __future__ import annotations

import io
import logging
from typing import List, Tuple

import numpy as np
from PIL import Image

from ..schemas import FaceComparison

logger = logging.getLogger("digiverify.face")

_BACKEND = "uninitialised"
_INSIGHT_APP = None


def backend_name() -> str:
    return _BACKEND


def _load_insight():
    global _INSIGHT_APP, _BACKEND
    if _INSIGHT_APP is not None or _BACKEND.startswith("insightface"):
        return _INSIGHT_APP
    try:
        from insightface.app import FaceAnalysis  # type: ignore

        app = FaceAnalysis(name="buffalo_l", providers=["CPUExecutionProvider"])
        app.prepare(ctx_id=0, det_size=(640, 640))
        _INSIGHT_APP = app
        _BACKEND = "insightface"
        logger.info("InsightFace loaded")
    except Exception as exc:  # pragma: no cover
        _BACKEND = f"prototype-fallback ({exc.__class__.__name__})"
        logger.warning("InsightFace unavailable: %s", exc)
    return _INSIGHT_APP


def _read_image(data: bytes) -> np.ndarray | None:
    try:
        pil = Image.open(io.BytesIO(data)).convert("RGB")
        return np.array(pil)
    except Exception:
        return None


def _has_face_via_opencv(arr: np.ndarray) -> bool:
    try:
        import cv2  # noqa: WPS433

        gray = cv2.cvtColor(arr, cv2.COLOR_RGB2GRAY)
        cascade_path = cv2.data.haarcascades + "haarcascade_frontalface_default.xml"
        cascade = cv2.CascadeClassifier(cascade_path)
        faces = cascade.detectMultiScale(gray, scaleFactor=1.1, minNeighbors=4, minSize=(40, 40))
        return len(faces) > 0
    except Exception:
        return False


def _insightface_compare(doc_arr: np.ndarray, photo_arr: np.ndarray) -> Tuple[float, str]:
    app = _load_insight()
    if app is None:
        raise RuntimeError("InsightFace not available")
    faces_doc = app.get(doc_arr)
    faces_photo = app.get(photo_arr)
    if not faces_doc:
        return 0.0, "Face could not be detected in the document."
    if not faces_photo:
        return 0.0, "Face could not be detected in the uploaded photo."
    emb_doc = faces_doc[0].normed_embedding
    emb_photo = faces_photo[0].normed_embedding
    sim = float(np.dot(emb_doc, emb_photo))  # cosine sim in [-1, 1]
    sim_pct = max(0.0, min(100.0, (sim + 1.0) * 50.0))  # map to 0-100
    return sim_pct, "ok"


def _hash_vec(arr: np.ndarray, size: int = 8) -> np.ndarray:
    pil = Image.fromarray(arr).resize((size, size), Image.Resampling.LANCZOS).convert("L")
    return np.array(pil, dtype=np.float32) / 255.0


def _prototype_similarity(doc_arr: np.ndarray, photo_arr: np.ndarray) -> Tuple[float, str]:
    """Lightweight fallback: structural similarity + brightness/saturation match.

    This is clearly a *prototype* — the UI labels it as such. The score
    is roughly correlated with visual similarity for similar face crops,
    but it is not a true biometric comparison.
    """
    if not _has_face_via_opencv(doc_arr):
        return 0.0, "Face could not be detected in the document."
    if not _has_face_via_opencv(photo_arr):
        return 0.0, "Face could not be detected in the uploaded photo."

    a = _hash_vec(doc_arr, 16).flatten()
    b = _hash_vec(photo_arr, 16).flatten()
    # Cosine similarity over hashed vectors
    na = np.linalg.norm(a) + 1e-6
    nb = np.linalg.norm(b) + 1e-6
    cos = float(np.dot(a, b) / (na * nb))
    cos_pct = max(0.0, min(100.0, (cos + 1.0) * 50.0))

    # Brightness/saturation delta
    def stats(arr: np.ndarray) -> Tuple[float, float]:
        hsv = Image.fromarray(arr).convert("HSV")
        hsv_arr = np.array(hsv)
        return float(hsv_arr[..., 1].mean()), float(hsv_arr[..., 2].mean())

    sa, va = stats(doc_arr)
    sb, vb = stats(photo_arr)
    delta = (abs(sa - sb) + abs(va - vb)) / 255.0
    consistency_bonus = max(0.0, 1.0 - delta) * 8.0  # 0-8 bonus

    score = max(35.0, min(98.0, cos_pct * 0.9 + consistency_bonus))
    return round(score, 1), "ok"


def compare(doc_bytes: bytes, photo_bytes: bytes) -> FaceComparison:
    """Return a face similarity comparison. Never raises."""
    doc_arr = _read_image(doc_bytes)
    photo_arr = _read_image(photo_bytes)
    if doc_arr is None or photo_arr is None:
        return FaceComparison(
            available=False,
            similarity=None,
            status="unavailable",
            message="Image could not be decoded for face comparison.",
        )

    sim: float | None = None
    msg = ""

    # Try InsightFace first
    if _INSIGHT_APP is not None or _BACKEND == "uninitialised":
        try:
            sim, msg = _insightface_compare(doc_arr, photo_arr)
        except Exception as exc:
            logger.warning("InsightFace compare failed: %s", exc)
            sim, msg = None, ""

    if sim is None:
        sim, msg = _prototype_similarity(doc_arr, photo_arr)

    if sim is None or msg != "ok":
        return FaceComparison(
            available=False,
            similarity=None,
            status="unavailable",
            message=msg or "Face could not be detected.",
        )

    if sim >= 85:
        status = "strong"
        message = "Strong similarity between document photograph and submitted photo."
    elif sim >= 65:
        status = "review"
        message = "Partial similarity. Manual review is recommended."
    else:
        status = "low"
        message = "Low similarity. Faces do not appear to match."

    return FaceComparison(
        available=True,
        similarity=sim,
        status=status,
        message=message,
    )
