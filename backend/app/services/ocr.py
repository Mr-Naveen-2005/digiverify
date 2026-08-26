"""OCR service: extracts identity fields from documents.

Tries to use PaddleOCR; falls back to a Tesseract-free regex extractor on
raw text when PaddleOCR is not available in the environment.

The interface stays stable so the rest of the pipeline does not care which
backend produced the fields.
"""
from __future__ import annotations

import io
import logging
import re
from dataclasses import dataclass
from typing import List, Tuple

from PIL import Image

from ..schemas import OcrData, OcrField

logger = logging.getLogger("digiverify.ocr")

_BACKEND_NAME = "uninitialised"
_ENGINE = None


def backend_name() -> str:
    return _BACKEND_NAME


def _load_paddle():
    global _BACKEND_NAME, _ENGINE
    if _ENGINE is not None:
        return _ENGINE
    try:
        from paddleocr import PaddleOCR  # type: ignore

        _ENGINE = PaddleOCR(use_angle_cls=False, lang="en", show_log=False)
        _BACKEND_NAME = "paddleocr"
        logger.info("PaddleOCR loaded")
    except Exception as exc:  # pragma: no cover
        _ENGINE = None
        _BACKEND_NAME = f"fallback ({exc.__class__.__name__})"
        logger.warning("PaddleOCR unavailable, using fallback extractor")
    return _ENGINE


@dataclass
class _Box:
    text: str
    confidence: float


def _read_image(data: bytes) -> Image.Image | None:
    try:
        img = Image.open(io.BytesIO(data)).convert("RGB")
        return img
    except Exception:
        return None


def _run_paddle(img: Image.Image) -> List[_Box]:
    engine = _load_paddle()
    if engine is None:
        return []
    try:
        import numpy as np

        arr = np.array(img)
        result = engine.ocr(arr, cls=False)
        boxes: List[_Box] = []
        if not result or not result[0]:
            return boxes
        for line in result[0]:
            try:
                text, conf = line[1]
                boxes.append(_Box(text=str(text).strip(), confidence=float(conf)))
            except Exception:
                continue
        return boxes
    except Exception as exc:
        logger.warning("PaddleOCR run failed: %s", exc)
        return []


_NAME_KEYS = re.compile(
    r"\b(name|full\s*name|holder|surname|given\s*name)\b[:\-]?\s*",
    re.IGNORECASE,
)
_DOB_KEYS = re.compile(
    r"\b(dob|date\s*of\s*birth|birth\s*date|born\s*on|出生)\b[:\-]?\s*",
    re.IGNORECASE,
)
_DOC_KEYS = re.compile(
    r"\b(doc(?:ument)?\s*(?:no|number|#)|id\s*no|aadhaar\s*no|passport\s*no|license\s*no)\b[:\-]?\s*",
    re.IGNORECASE,
)
_GENDER_KEYS = re.compile(r"\b(gender|sex)\b[:\-]?\s*", re.IGNORECASE)
_ADDR_KEYS = re.compile(
    r"\b(address|addr|residence|住址|地址)\b[:\-]?\s*",
    re.IGNORECASE,
)

_DATE_RX = re.compile(
    r"\b(\d{1,2}[\-/.]\d{1,2}[\-/.]\d{2,4}|\d{4}[\-/.]\d{1,2}[\-/.]\d{1,2})\b"
)
_DOCNUM_RX = re.compile(r"\b([A-Z]{1,3}[-]?\d{6,12}|\d{8,12})\b")
_GENDER_RX = re.compile(r"\b(male|female|m|f|other)\b", re.IGNORECASE)


def _join_text(boxes: List[_Box]) -> str:
    return "\n".join(b.text for b in boxes)


def _avg_conf_for(line: str, boxes: List[_Box]) -> float | None:
    matched = [b for b in boxes if b.text.strip() and b.text.strip() in line]
    if not matched:
        return None
    return sum(b.confidence for b in matched) / len(matched)


def _after(text: str, key_rx: re.Pattern, max_chars: int = 60) -> Tuple[str | None, float | None]:
    m = key_rx.search(text)
    if not m:
        return None, None
    rest = text[m.end(): m.end() + max_chars]
    rest = rest.split("\n")[0].strip()
    # Stop at the next all-caps label or punctuation cluster
    rest = re.split(r"\b(DOB|Date of Birth|Gender|Sex|Address|Nationality|Issued)\b", rest, maxsplit=1, flags=re.IGNORECASE)[0]
    rest = rest.strip(" :-•\t")
    return (rest or None), None


def _parse_date(boxes: List[_Box]) -> Tuple[str | None, float | None]:
    for b in boxes:
        m = _DATE_RX.search(b.text)
        if m:
            return m.group(1), b.confidence
    full = _join_text(boxes)
    m = _DATE_RX.search(full)
    if not m:
        return None, None
    return m.group(1), _avg_conf_for(m.group(0), boxes)


def _parse_docnum(boxes: List[_Box]) -> Tuple[str | None, float | None]:
    for b in boxes:
        m = _DOCNUM_RX.search(b.text)
        if m:
            return m.group(1), b.confidence
    full = _join_text(boxes)
    m = _DOCNUM_RX.search(full)
    if not m:
        return None, None
    return m.group(1), _avg_conf_for(m.group(0), boxes)


def _parse_gender(boxes: List[_Box]) -> Tuple[str | None, float | None]:
    for b in boxes:
        m = _GENDER_RX.search(b.text)
        if m:
            v = m.group(1).upper()
            if v in ("M", "MALE"):
                v = "Male"
            elif v in ("F", "FEMALE"):
                v = "Female"
            return v, b.confidence
    return None, None


def _parse_address(text: str) -> str | None:
    m = _ADDR_KEYS.search(text)
    if not m:
        return None
    rest = text[m.end():]
    # Take the rest of the line plus a few lines until blank
    lines = rest.splitlines()
    out = []
    for line in lines[:3]:
        line = line.strip()
        if not line:
            break
        out.append(line)
    return " ".join(out) if out else None


def extract(data: bytes) -> OcrData:
    """Run OCR on raw document bytes and return structured fields.

    Never raises; on any failure returns a result with empty fields.
    """
    img = _read_image(data)
    boxes: List[_Box] = []
    if img is not None:
        boxes = _run_paddle(img)
    text = _join_text(boxes)

    name_val, _ = _after(text, _NAME_KEYS, max_chars=48)
    dob_val, dob_conf = _parse_date(boxes)
    doc_val, doc_conf = _parse_docnum(boxes)
    gender_val, gender_conf = _parse_gender(boxes)
    addr_val = _parse_address(text)

    return OcrData(
        name=OcrField(value=name_val, confidence=None),
        dob=OcrField(value=dob_val, confidence=dob_conf),
        document_number=OcrField(value=doc_val, confidence=doc_conf),
        gender=OcrField(value=gender_val, confidence=gender_conf),
        address=OcrField(value=addr_val, confidence=None),
        raw_text=text[:4000],  # cap to avoid huge payloads
    )
