"""Cross-document comparison.

Compares basic identity fields across the primary document and any
extra documents uploaded. Treats mismatches as *indicators*, never as
automatic fraud.
"""
from __future__ import annotations

import logging
import re
from difflib import SequenceMatcher
from typing import List

from ..schemas import CrossDocumentResult, OcrData

logger = logging.getLogger("digiverify.crossdoc")

_NAME_RX = re.compile(r"\s+")


def _norm_name(s: str | None) -> str:
    if not s:
        return ""
    s = s.strip().lower()
    s = _NAME_RX.sub(" ", s)
    return s


def _norm_dob(s: str | None) -> str:
    if not s:
        return ""
    s = s.strip()
    # Try to normalise dates to YYYY-MM-DD
    m = re.match(r"(\d{1,2})[\-/.](\d{1,2})[\-/.](\d{2,4})", s)
    if m:
        d, mo, y = m.groups()
        if len(y) == 2:
            y = "19" + y if int(y) > 30 else "20" + y
        return f"{int(y):04d}-{int(mo):02d}-{int(d):02d}"
    m = re.match(r"(\d{4})[\-/.](\d{1,2})[\-/.](\d{1,2})", s)
    if m:
        y, mo, d = m.groups()
        return f"{int(y):04d}-{int(mo):02d}-{int(d):02d}"
    return s.lower()


def _norm_doc(s: str | None) -> str:
    if not s:
        return ""
    return re.sub(r"[^a-z0-9]", "", s.lower())


def _norm_gender(s: str | None) -> str:
    if not s:
        return ""
    s = s.strip().lower()
    if s in ("m", "male"):
        return "male"
    if s in ("f", "female"):
        return "female"
    return s


def _name_close(a: str, b: str) -> bool:
    if not a or not b:
        return False
    if a == b:
        return True
    ratio = SequenceMatcher(None, a, b).ratio()
    return ratio >= 0.85


def compare(primary: OcrData, extras: List[OcrData]) -> CrossDocumentResult:
    if not extras:
        return CrossDocumentResult(
            available=False,
            compared=False,
            matches=[],
            mismatches=[],
            message="Cross-document comparison unavailable (only one document uploaded).",
        )

    matches: List[str] = []
    mismatches: List[str] = []
    used_extras = 0

    for idx, other in enumerate(extras, start=2):
        used_extras += 1
        # Name
        a = _norm_name(primary.name.value)
        b = _norm_name(other.name.value)
        if a and b:
            if _name_close(a, b):
                matches.append(f"Document {idx}: Name matches.")
            else:
                mismatches.append(
                    f"Document {idx}: Name differs (\"{primary.name.value}\" vs \"{other.name.value}\")."
                )

        # DOB
        a = _norm_dob(primary.dob.value)
        b = _norm_dob(other.dob.value)
        if a and b:
            if a == b:
                matches.append(f"Document {idx}: Date of birth matches.")
            else:
                mismatches.append(
                    f"Document {idx}: Date of birth differs (\"{primary.dob.value}\" vs \"{other.dob.value}\")."
                )

        # Gender
        a = _norm_gender(primary.gender.value)
        b = _norm_gender(other.gender.value)
        if a and b:
            if a == b:
                matches.append(f"Document {idx}: Gender matches.")
            else:
                mismatches.append(
                    f"Document {idx}: Gender differs (\"{primary.gender.value}\" vs \"{other.gender.value}\")."
                )

        # Document number
        a = _norm_doc(primary.document_number.value)
        b = _norm_doc(other.document_number.value)
        if a and b:
            if a == b:
                matches.append(f"Document {idx}: Document number matches.")
            else:
                mismatches.append(
                    f"Document {idx}: Document number differs (\"{primary.document_number.value}\" vs \"{other.document_number.value}\")."
                )

    if used_extras == 0:
        return CrossDocumentResult(
            available=False,
            compared=False,
            message="Cross-document comparison unavailable (no readable fields in extra documents).",
        )

    if not mismatches:
        return CrossDocumentResult(
            available=True,
            compared=True,
            matches=matches,
            mismatches=[],
            message="All compared fields are consistent across the submitted documents.",
        )

    return CrossDocumentResult(
        available=True,
        compared=True,
        matches=matches,
        mismatches=mismatches,
        message="Identity inconsistency detected across submitted documents.",
    )
