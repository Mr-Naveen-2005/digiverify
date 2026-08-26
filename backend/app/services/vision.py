"""Computer-vision based basic document analysis.

These checks are intentionally *indicators* not proofs. They look for
common signals that have been associated with manipulated or
non-genuine document images (e.g. inconsistent noise between regions,
heavy compression on text regions, edge anomalies). They are never
treated as proof of forgery on their own.
"""
from __future__ import annotations

import io
import logging
from typing import List, Tuple

import cv2
import numpy as np
from PIL import Image

from ..schemas import DocumentIndicators

logger = logging.getLogger("digiverify.vision")


def _read_image(data: bytes) -> np.ndarray | None:
    try:
        arr = np.frombuffer(data, dtype=np.uint8)
        img = cv2.imdecode(arr, cv2.IMREAD_COLOR)
        if img is None:
            pil = Image.open(io.BytesIO(data)).convert("RGB")
            img = cv2.cvtColor(np.array(pil), cv2.COLOR_RGB2BGR)
        return img
    except Exception as exc:
        logger.warning("Could not decode image: %s", exc)
        return None


def _stddev_block(block: np.ndarray) -> float:
    return float(np.std(block))


def _noise_map(gray: np.ndarray, ksize: int = 3) -> np.ndarray:
    """Estimate high-frequency noise using Laplacian magnitude."""
    blur = cv2.GaussianBlur(gray, (ksize, ksize), 0)
    diff = cv2.absdiff(gray, blur)
    return diff


def _edge_density(gray: np.ndarray) -> float:
    edges = cv2.Canny(gray, 80, 180)
    return float(np.count_nonzero(edges)) / float(gray.size or 1)


def _compression_artifacts(gray: np.ndarray) -> float:
    """Detect blocky JPEG artefacts by counting 8x8 grid discontinuities."""
    h, w = gray.shape
    if h < 16 or w < 16:
        return 0.0
    # Difference at 8-pixel boundaries vs random offsets
    h_b = np.abs(gray[:, 8:] - gray[:, :-8]).mean()
    h_r = np.abs(gray[:, 4:] - gray[:, :-4]).mean()
    if h_r <= 0:
        return 0.0
    ratio = float(h_b) / float(h_r)
    # Values near 1.0 mean no obvious 8-pixel grid.
    # Values > 1.6 mean very blocky.
    return max(0.0, min(1.0, (ratio - 1.0) / 0.8))


def _region_anomaly(img: np.ndarray) -> Tuple[float, List[str]]:
    """Compare statistics of an inner patch vs the border to detect
    pasted-in regions."""
    h, w = img.shape[:2]
    if h < 80 or w < 80:
        return 0.0, []

    # Border strip ~12% thickness
    t = max(8, int(0.12 * min(h, w)))
    border = np.concatenate(
        [
            img[:t, :].reshape(-1, 3),
            img[-t:, :].reshape(-1, 3),
            img[:, :t].reshape(-1, 3),
            img[:, -t:].reshape(-1, 3),
        ],
        axis=0,
    )
    border_mean = border.mean(axis=0)
    border_std = border.std(axis=0) + 1e-6

    inner = img[t:-t, t:-t]
    inner_mean = inner.mean(axis=(0, 1))
    inner_std = inner.std(axis=(0, 1)) + 1e-6

    # Z-score distance between inner and border in color space
    z = np.abs(inner_mean - border_mean) / np.maximum(border_std, 1.0)
    color_anomaly = float(np.clip(z.mean() / 2.5, 0, 1))

    # Noise/texture mismatch
    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    noise = _noise_map(gray)
    nb = float(noise[:t, :].mean() + noise[-t:, :].mean() + noise[:, :t].mean() + noise[:, -t:].mean()) / 4.0
    ni = float(noise[t:-t, t:-t].mean())
    diff = abs(ni - nb) / (nb + 1e-6)
    noise_anomaly = float(np.clip(diff / 1.0, 0, 1))

    notes: List[str] = []
    anomaly = 0.5 * color_anomaly + 0.5 * noise_anomaly
    if color_anomaly > 0.35:
        notes.append(
            "Color/lighting differs between inner and outer regions (possible pasted region)."
        )
    if noise_anomaly > 0.4:
        notes.append(
            "Texture/noise pattern differs between inner and outer regions (possible re-saved region)."
        )
    return float(np.clip(anomaly, 0, 1)), notes


def analyze(data: bytes) -> DocumentIndicators:
    """Return a prototype indicator report for the given image bytes.

    The output is *only an indicator* — never a proof of fraud.
    """
    img = _read_image(data)
    if img is None:
        return DocumentIndicators(
            indicators=["Could not decode image for analysis."],
            notes=[],
            anomaly_score=0.0,
        )

    indicators: List[str] = []
    notes: List[str] = []
    scores: List[float] = []

    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)

    # 1) very low resolution
    h, w = gray.shape
    if max(h, w) < 200:
        indicators.append("Document image is low resolution (under 200px on a side).")
        scores.append(0.4)

    # 2) edge density (anomalously high or low)
    edge = _edge_density(gray)
    if edge > 0.18:
        indicators.append("Unusually high edge density (possible synthetic or re-saved image).")
        scores.append(0.35)
    elif edge < 0.012 and max(h, w) > 200:
        indicators.append("Very low edge density (possible over-smoothed region).")
        scores.append(0.2)

    # 3) blocky compression artefacts
    blocky = _compression_artifacts(gray)
    if blocky > 0.5:
        indicators.append("Strong 8x8 block artefacts (heavy JPEG re-compression).")
        scores.append(0.3)

    # 4) region anomaly
    region_score, region_notes = _region_anomaly(img)
    if region_score > 0.25:
        indicators.append(
            "Possible manipulation: inner region differs in color or noise from border."
        )
        scores.append(region_score)
    notes.extend(region_notes)

    # 5) very large or unusual aspect ratio
    aspect = w / max(h, 1)
    if aspect < 0.4 or aspect > 3.5:
        indicators.append("Unusual aspect ratio for an identity document.")
        scores.append(0.2)

    # 6) saturation / overexposure
    hsv = cv2.cvtColor(img, cv2.COLOR_BGR2HSV)
    sat_mean = float(hsv[..., 1].mean())
    val_mean = float(hsv[..., 2].mean())
    if sat_mean > 180 or val_mean > 245:
        indicators.append("Image appears over-saturated or overexposed (possible re-render).")
        scores.append(0.25)

    if not indicators:
        indicators.append("No obvious suspicious indicator detected.")

    anomaly_pct = round(min(100.0, max(scores) * 100.0 if scores else 0.0), 1)

    return DocumentIndicators(
        indicators=indicators,
        notes=notes,
        anomaly_score=anomaly_pct,
    )
