export type RiskLevel = 'LOW' | 'REVIEW' | 'HIGH';

export type Severity = 'info' | 'success' | 'warning' | 'danger';

export interface OcrField {
  value: string | null;
  confidence: number | null;
}

export interface OcrData {
  name: OcrField;
  dob: OcrField;
  document_number: OcrField;
  gender: OcrField;
  address: OcrField;
  raw_text: string;
}

export interface DocumentIndicators {
  indicators: string[];
  notes: string[];
  anomaly_score: number; // 0-100, higher = more anomalous
}

export interface FaceComparison {
  available: boolean;
  similarity: number | null; // 0-100
  status: 'strong' | 'review' | 'low' | 'unavailable';
  message: string;
}

export interface CrossDocumentResult {
  available: boolean;
  compared: boolean;
  matches: string[];
  mismatches: string[];
  message: string;
}

export interface Finding {
  severity: Severity;
  title: string;
  explanation: string;
}

export interface AiExplanation {
  risk_level: RiskLevel;
  summary: string;
  findings: Finding[];
  recommendation: string;
  source: 'gemini' | 'fallback';
}

export interface AnalyzeResponse {
  document_type: string;
  verification_type: string;
  ocr: OcrData;
  document_indicators: DocumentIndicators;
  face_similarity: FaceComparison;
  cross_document: CrossDocumentResult;
  risk_score: number;
  risk_level: RiskLevel;
  ai_explanation: AiExplanation;
  generated_at: string;
}

export type VerificationType =
  | 'General Identity Verification'
  | 'Hostel Verification'
  | 'HR Verification'
  | 'Student Verification'
  | 'Client Verification';
