"""Pydantic schemas for the analyze API."""
from __future__ import annotations

from typing import List, Literal, Optional

from pydantic import BaseModel, Field


RiskLevel = Literal["LOW", "REVIEW", "HIGH"]
Severity = Literal["info", "success", "warning", "danger"]


class OcrField(BaseModel):
    value: Optional[str] = None
    confidence: Optional[float] = None


class OcrData(BaseModel):
    name: OcrField = Field(default_factory=OcrField)
    dob: OcrField = Field(default_factory=OcrField)
    document_number: OcrField = Field(default_factory=OcrField)
    gender: OcrField = Field(default_factory=OcrField)
    address: OcrField = Field(default_factory=OcrField)
    raw_text: str = ""


class DocumentIndicators(BaseModel):
    indicators: List[str] = Field(default_factory=list)
    notes: List[str] = Field(default_factory=list)
    anomaly_score: float = 0.0  # 0-100, higher = more anomalous


class FaceComparison(BaseModel):
    available: bool = False
    similarity: Optional[float] = None
    status: Literal["strong", "review", "low", "unavailable"] = "unavailable"
    message: str = "Face similarity was not evaluated."


class CrossDocumentResult(BaseModel):
    available: bool = False
    compared: bool = False
    matches: List[str] = Field(default_factory=list)
    mismatches: List[str] = Field(default_factory=list)
    message: str = "Cross-document comparison unavailable."


class Finding(BaseModel):
    severity: Severity = "info"
    title: str
    explanation: str


class AiExplanation(BaseModel):
    risk_level: RiskLevel = "REVIEW"
    summary: str = ""
    findings: List[Finding] = Field(default_factory=list)
    recommendation: str = ""
    source: Literal["gemini", "fallback"] = "fallback"


class AnalyzeResponse(BaseModel):
    document_type: str = "Unknown"
    verification_type: str = "General Identity Verification"
    ocr: OcrData = Field(default_factory=OcrData)
    document_indicators: DocumentIndicators = Field(default_factory=DocumentIndicators)
    face_similarity: FaceComparison = Field(default_factory=FaceComparison)
    cross_document: CrossDocumentResult = Field(default_factory=CrossDocumentResult)
    risk_score: int = 0
    risk_level: RiskLevel = "REVIEW"
    ai_explanation: AiExplanation = Field(default_factory=AiExplanation)
    generated_at: str = ""


class HealthResponse(BaseModel):
    status: str
    gemini: bool
    ocr: str
    face: str
