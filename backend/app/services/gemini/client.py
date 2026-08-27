"""Gemini AI explainer.

The model is given *only* structured evidence from the verification
pipeline. It returns a strict JSON envelope describing the risk level,
summary, findings, and recommendation. The frontend renders the
findings directly — so the explanation is always grounded in the
evidence the system actually collected.
"""
from __future__ import annotations

import json
import logging
import re
from concurrent.futures import ThreadPoolExecutor, TimeoutError as FuturesTimeout
from typing import Any, Dict

from ...config import settings
from ...schemas import AiExplanation, Finding

logger = logging.getLogger("digiverify.gemini")

_MODEL = None
_LAST_ERROR: str | None = None


def last_error() -> str | None:
    return _LAST_ERROR


def _load_model():
    global _MODEL
    if _MODEL is not None:
        return _MODEL
    if not settings.gemini_enabled:
        return None
    try:
        import google.generativeai as genai  # type: ignore

        genai.configure(api_key=settings.GEMINI_API_KEY)
        _MODEL = genai.GenerativeModel(
            model_name=settings.GEMINI_MODEL,
            generation_config={
                "response_mime_type": "application/json",
                "temperature": 0.2,
            },
        )
        logger.info("Gemini model %s loaded", settings.GEMINI_MODEL)
    except Exception as exc:  # pragma: no cover
        _LAST_ERROR = f"{exc.__class__.__name__}: {exc}"
        logger.warning("Could not initialise Gemini: %s", exc)
        _MODEL = None
    return _MODEL


def _build_prompt(evidence: Dict[str, Any]) -> str:
    return (
        "You are a digital identity verification reviewer. You are given a "
        "structured evidence object describing a single verification run. "
        "Your job is to explain WHY the verification has the level it does, "
        "based ONLY on the evidence provided. Do not invent results. Do not "
        "claim proof of fraud — only call out indicators and inconsistencies.\n\n"
        "Return strictly valid JSON with this schema:\n"
        "{\n"
        '  "risk_level": "LOW" | "REVIEW" | "HIGH",\n'
        '  "summary": string,   // 1-2 sentence plain English summary\n'
        '  "findings": [\n'
        '    {"severity": "info"|"success"|"warning"|"danger", '
        ' "title": string, "explanation": string}\n'
        "  ],\n"
        '  "recommendation": string  // short, actionable next step\n'
        "}\n\n"
        "Evidence (JSON):\n"
        + json.dumps(evidence, ensure_ascii=False, indent=2)
    )


_JSON_BLOCK = re.compile(r"\{.*\}", re.DOTALL)


def _safe_parse(text: str) -> Dict[str, Any] | None:
    if not text:
        return None
    try:
        return json.loads(text)
    except Exception:
        m = _JSON_BLOCK.search(text)
        if not m:
            return None
        try:
            return json.loads(m.group(0))
        except Exception:
            return None


def _coerce(data: Dict[str, Any], fallback_level: str) -> AiExplanation:
    findings_raw = data.get("findings") or []
    findings: list[Finding] = []
    for f in findings_raw:
        if not isinstance(f, dict):
            continue
        try:
            findings.append(
                Finding(
                    severity=f.get("severity", "info"),
                    title=str(f.get("title", "")).strip() or "Finding",
                    explanation=str(f.get("explanation", "")).strip(),
                )
            )
        except Exception:
            continue

    risk = str(data.get("risk_level", fallback_level)).upper()
    if risk not in ("LOW", "REVIEW", "HIGH"):
        risk = fallback_level

    return AiExplanation(
        risk_level=risk,  # type: ignore[arg-type]
        summary=str(data.get("summary", "")).strip(),
        findings=findings,
        recommendation=str(data.get("recommendation", "")).strip(),
        source="gemini",
    )


def explain(evidence: Dict[str, Any], fallback_level: str) -> AiExplanation:
    """Call Gemini for a structured explanation; fall back to a rule-based one
    if anything goes wrong. Never raises."""
    model = _load_model()
    if model is None:
        return _fallback(evidence, fallback_level, reason="unavailable")

    try:
        with ThreadPoolExecutor(max_workers=1) as ex:
            future = ex.submit(model.generate_content, _build_prompt(evidence))
            response = future.result(timeout=8)
        text = getattr(response, "text", "") or ""
        parsed = _safe_parse(text)
        if not parsed:
            return _fallback(evidence, fallback_level, reason="invalid_response")
        return _coerce(parsed, fallback_level)
    except FuturesTimeout:
        logger.warning("Gemini call timed out after 8s")
        return _fallback(evidence, fallback_level, reason="timeout")
    except Exception as exc:
        msg = str(exc)
        # Strip very long error text — fall back gracefully
        if len(msg) > 200:
            msg = msg[:200] + "…"
        logger.warning("Gemini call failed: %s", exc)
        return _fallback(evidence, fallback_level, reason=msg)


def _fallback(evidence: Dict[str, Any], level: str, reason: str = "unavailable") -> AiExplanation:
    findings: list[Finding] = []
    doc_ind = evidence.get("document_indicators", {}) or {}
    for ind in doc_ind.get("indicators", []) or []:
        findings.append(
            Finding(severity="warning", title="Document indicator", explanation=str(ind))
        )

    cross = evidence.get("cross_document", {}) or {}
    for mm in cross.get("mismatches", []) or []:
        findings.append(
            Finding(severity="warning", title="Identity inconsistency", explanation=str(mm))
        )

    face = evidence.get("face_similarity", {}) or {}
    if face.get("available"):
        sim = face.get("similarity")
        if sim is not None and sim >= 85:
            findings.append(
                Finding(
                    severity="success",
                    title="Face similarity",
                    explanation=f"Strong similarity was detected ({sim:.1f}%).",
                )
            )
        elif sim is not None and sim < 65:
            findings.append(
                Finding(
                    severity="danger",
                    title="Face similarity",
                    explanation=f"Low similarity was detected ({sim:.1f}%).",
                )
            )
        else:
            findings.append(
                Finding(
                    severity="info",
                    title="Face similarity",
                    explanation=f"Partial similarity was detected ({sim:.1f}%).",
                )
            )

    if not findings:
        findings.append(
            Finding(
                severity="success",
                title="No major indicators",
                explanation="No obvious suspicious indicators were detected in the available evidence.",
            )
        )

    summary_map = {
        "LOW": "No major suspicious indicators were detected.",
        "REVIEW": "Some indicators require manual verification.",
        "HIGH": "Multiple suspicious indicators require manual verification.",
    }
    rec_map = {
        "LOW": "The identity appears consistent. Standard processing is acceptable.",
        "REVIEW": "Manual verification is recommended before accepting the identity.",
        "HIGH": "Manual review is strongly recommended before accepting the identity.",
    }

    if reason not in ("unavailable", "invalid_response"):
        note = f" (Gemini error: {reason})"
    else:
        note = ""
    return AiExplanation(
        risk_level=level,  # type: ignore[arg-type]
        summary=summary_map.get(level, "Verification completed.") + note,
        findings=findings,
        recommendation=rec_map.get(level, "Manual review is recommended."),
        source="fallback",
    )
