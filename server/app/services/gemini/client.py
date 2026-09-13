"""Groq AI explainer.

This module uses the Groq SDK to provide high-performance forensic reasoning
using the gpt-oss-120b model. It returns a strict JSON envelope describing
the risk level, summary, findings, and recommendation.
"""
from __future__ import annotations

import json
import logging
import re
import threading
import time
from typing import Any, Dict

from ...config import settings
from ...models import AiExplanation, Finding

logger = logging.getLogger("digiverify.groq")

_CLIENT = None
_CLIENT_LOCK = threading.Lock()
_LAST_ERROR: str | None = None

# How many times to retry a transient failure.
_MAX_ATTEMPTS = 2


def last_error() -> str | None:
    return _LAST_ERROR


def _get_client():
    """Lazily build a shared Groq client."""
    global _CLIENT
    if _CLIENT is not None:
        return _CLIENT
    if not settings.openai_enabled:
        return None
    with _CLIENT_LOCK:
        if _CLIENT is not None:
            return _CLIENT
        try:
            from groq import Groq  # type: ignore

            _CLIENT = Groq(api_key=settings.OPENAI_API_KEY)
            logger.info(
                "Groq client ready, model=%s",
                settings.OPENAI_MODEL,
            )
        except Exception as exc:  # pragma: no cover
            _LAST_ERROR = f"{exc.__class__.__name__}: {exc}"
            logger.warning("Could not initialise Groq client: %s", exc)
            _CLIENT = None
    return _CLIENT


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
        source="groq",
    )


def _call_groq(evidence: Dict[str, Any]) -> str:
    """Submit the prompt to Groq and return the assistant's raw text."""
    client = _get_client()
    if client is None:
        raise RuntimeError("ai_unavailable")

    completion = client.chat.completions.create(
        model=settings.OPENAI_MODEL,
        messages=[
            {
                "role": "system",
                "content": "You respond only with valid JSON matching the schema the user provides. No prose, no markdown fences.",
            },
            {"role": "user", "content": _build_prompt(evidence)},
        ],
        temperature=1,
        max_completion_tokens=2048,
        top_p=1,
    )

    text = ""
    try:
        text = completion.choices[0].message.content or ""
    except (AttributeError, IndexError, KeyError):
        text = ""
    if not text.strip():
        raise RuntimeError("empty_response")
    return text


def explain(evidence: Dict[str, Any], fallback_level: str) -> AiExplanation:
    """Call the Groq model for a structured explanation; fall back
    to a rule-based one if anything goes wrong. Never raises."""
    if not settings.openai_enabled or _get_client() is None:
        return _fallback(evidence, fallback_level, reason="unavailable")

    last_err: str | None = None
    for attempt in range(1, _MAX_ATTEMPTS + 1):
        try:
            text = _call_groq(evidence)
            parsed = _safe_parse(text)
            if not parsed:
                last_err = "invalid_response"
                logger.warning("Groq returned non-JSON (attempt %d)", attempt)
                continue
            return _coerce(parsed, fallback_level)
        except Exception as exc:
            msg = str(exc)
            if len(msg) > 200:
                msg = msg[:200] + "…"
            last_err = msg
            logger.warning(
                "Groq call failed (attempt %d/%d): %s",
                attempt, _MAX_ATTEMPTS, exc,
            )

        if attempt < _MAX_ATTEMPTS:
            time.sleep(1.5 * attempt)

    return _fallback(evidence, fallback_level, reason=last_err or "unavailable")


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

    if reason not in ("unavailable", "invalid_response", "timeout"):
        rec_tail = f" (AI error: {reason})"
    else:
        rec_tail = ""
    return AiExplanation(
        risk_level=level,  # type: ignore[arg-type]
        summary=summary_map.get(level, "Verification completed."),
        findings=findings,
        recommendation=rec_map.get(level, "Manual review is recommended.") + rec_tail,
        source="fallback",
    )
