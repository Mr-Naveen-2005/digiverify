import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  AlertTriangle,
  CheckCircle2,
  Info,
  ShieldCheck,
  XCircle,
  FileText,
  Brain,
  Sparkles,
  RotateCcw,
  Lock,
  Cpu,
  Fingerprint,
} from 'lucide-react';
import type {
  AnalyzeResponse,
  RiskLevel,
  Severity,
} from '../types';

const STATUS_BADGE: Record<RiskLevel, { cls: string; label: string }> = {
  LOW: { cls: 'badge-success', label: 'PASSED // HIGH TRUST' },
  REVIEW: { cls: 'badge-warning', label: 'REQUIRES MANUAL AUDIT' },
  HIGH: { cls: 'badge-danger', label: 'ELEVATED THREAT RISK' },
};

const SEVERITY_ICON: Record<Severity, typeof Info> = {
  info: Info,
  success: CheckCircle2,
  warning: AlertTriangle,
  danger: XCircle,
};

const SEVERITY_COLOR: Record<Severity, string> = {
  info: 'text-signal-cyan',
  success: 'text-signal-green',
  warning: 'text-signal-gold',
  danger: 'text-status-danger',
};

const SEVERITY_BG: Record<Severity, string> = {
  info: 'bg-signal-cyan/10 border-signal-cyan/30',
  success: 'bg-signal-green/10 border-signal-green/30',
  warning: 'bg-signal-gold/10 border-signal-gold/30',
  danger: 'bg-status-danger/10 border-status-danger/30',
};

function ScoreRing({
  score,
  level,
}: {
  score: number;
  level: RiskLevel;
}) {
  const r = 90;
  const c = 2 * Math.PI * r;
  const offset = c - (score / 100) * c;
  const color = level === 'LOW' ? '#00ff87' : level === 'REVIEW' ? '#facc15' : '#ff4b4b';

  return (
    <div className="relative w-52 h-52 mx-auto font-mono">
      <svg width="208" height="208" viewBox="0 0 208 208" className="-rotate-90">
        <circle
          cx="104"
          cy="104"
          r={r}
          fill="none"
          stroke="#050914"
          strokeWidth="12"
        />
        <circle
          cx="104"
          cy="104"
          r={r}
          fill="none"
          stroke={color}
          strokeWidth="12"
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={offset}
          style={{
            transition: 'stroke-dashoffset 1.2s ease-out',
            filter: `drop-shadow(0 0 16px ${color}aa)`,
          }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <div className="text-5xl font-extrabold text-text-main tabular-nums">
          {score}
        </div>
        <div className="text-xs text-text-muted mt-0.5">/ 100 TRUST INDEX</div>
        <div
          className={`mt-2.5 badge ${STATUS_BADGE[level].cls}`}
        >
          {STATUS_BADGE[level].label}
        </div>
      </div>
    </div>
  );
}

function FieldRow({ label, value }: { label: string; value: string | null }) {
  return (
    <div className="flex items-baseline justify-between gap-3 py-2 border-b border-signal-border/30 last:border-0 font-mono">
      <span className="text-[11px] text-text-muted uppercase tracking-wider">
        {label}
      </span>
      <span className="text-xs text-text-main text-right truncate">
        {value || <span className="text-text-muted italic font-sans">Not detected</span>}
      </span>
    </div>
  );
}

export default function Result() {
  const navigate = useNavigate();
  const [result, setResult] = useState<AnalyzeResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const raw = sessionStorage.getItem('digiverify.result');
    if (!raw) {
      setError('No verification result found. Please run a verification first.');
      return;
    }
    try {
      setResult(JSON.parse(raw) as AnalyzeResponse);
    } catch {
      setError('Failed to load verification result.');
    }
  }, []);

  if (error) {
    return (
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center font-mono">
        <AlertTriangle className="w-10 h-10 text-signal-gold mx-auto mb-3" />
        <h1 className="text-xl font-bold text-text-main">{error}</h1>
        <Link to="/verify" className="btn-primary mt-5 inline-flex">
          <RotateCcw className="w-4 h-4" /> Start New Verification
        </Link>
      </div>
    );
  }

  if (!result) {
    return (
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center text-text-secondary font-mono">
        Loading Telemetry HUD…
      </div>
    );
  }

  const ai = result.ai_explanation;
  const summary = ai.summary;
  const isHigh = result.risk_level === 'HIGH';

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-6 font-mono">
      {/* Top Navigation */}
      <div className="flex items-center justify-between">
        <Link
          to="/verify"
          className="text-xs text-signal-cyan hover:text-signal-green inline-flex items-center gap-2"
        >
          <ArrowLeft className="w-4 h-4" /> [← TERMINAL INPUT BUFFER]
        </Link>
        <div className="text-xs text-text-muted flex items-center gap-2">
          <Lock className="w-3.5 h-3.5 text-signal-green" />
          <span>AUDIT TIMESTAMP: {new Date(result.generated_at).toLocaleString()}</span>
        </div>
      </div>

      {/* Header Banner */}
      <div className="border-b border-signal-border/40 pb-5 space-y-1">
        <div className="text-xs uppercase tracking-widest text-signal-green">
          // FORENSIC AUDIT RESULT
        </div>
        <h1 className="text-3xl font-extrabold text-text-main flex items-center gap-3">
          {result.risk_level === 'LOW'
            ? 'Identity Credential Verified'
            : result.risk_level === 'REVIEW'
              ? 'Manual Audit Recommended'
              : 'Security Anomaly Flagged'}
          <span className="text-xs px-2.5 py-1 rounded-full bg-signal-secondary border border-signal-border text-signal-cyan">
            ID: SEC-AUDITED
          </span>
        </h1>
      </div>

      {/* Score + Summary Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="card p-6 lg:col-span-1 flex flex-col items-center justify-center border-signal-border/30">
          <ScoreRing score={result.risk_score} level={result.risk_level} />
          <div className="mt-4 text-xs text-text-muted text-center leading-relaxed">
            SAFETY INDEX SCORE
            <br />
            <span className="text-[10px] text-text-secondary font-sans">(Higher score indicates higher trust & safety)</span>
          </div>
        </div>

        <div className="card p-6 lg:col-span-2 space-y-5 border-signal-border/30">
          <div className="flex items-center justify-between border-b border-signal-border/30 pb-3">
            <div className="flex items-center gap-2 text-xs text-signal-green font-bold">
              <FileText className="w-4 h-4" />
              <span>FORENSIC EXECUTIVE SUMMARY</span>
            </div>
            <span className="text-[10px] text-signal-green font-bold">● AUDIT COMPLETE</span>
          </div>

          <p className="text-sm text-text-main leading-relaxed font-sans">{summary}</p>

          <div className="grid grid-cols-2 gap-3 font-mono">
            <div className="rounded-xl bg-signal-bg border border-signal-border/40 p-3">
              <div className="text-[10px] uppercase tracking-widest text-text-muted mb-1">
                Document Type
              </div>
              <div className="text-sm font-bold text-signal-cyan">
                {result.document_type || 'Identity Document'}
              </div>
            </div>
            <div className="rounded-xl bg-signal-bg border border-signal-border/40 p-3">
              <div className="text-[10px] uppercase tracking-widest text-text-muted mb-1">
                Verification Domain
              </div>
              <div className="text-sm font-bold text-text-main">
                {result.verification_type}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
            <Stat
              label="Document Visual"
              value={`${100 - result.document_indicators.anomaly_score}/100`}
              tone={
                result.document_indicators.anomaly_score < 25
                  ? 'success'
                  : result.document_indicators.anomaly_score < 50
                    ? 'warning'
                    : 'danger'
              }
            />
            <Stat
              label="Face Similarity"
              value={
                result.face_similarity.similarity !== null
                  ? `${result.face_similarity.similarity.toFixed(1)}%`
                  : 'N/A'
              }
              tone={
                result.face_similarity.status === 'strong'
                  ? 'success'
                  : result.face_similarity.status === 'review'
                    ? 'warning'
                    : result.face_similarity.status === 'low'
                      ? 'danger'
                      : 'info'
              }
            />
            <Stat
              label="Consistency"
              value={
                result.cross_document.available
                  ? result.cross_document.mismatches.length > 0
                    ? 'Mismatch'
                    : 'Match'
                  : 'N/A'
              }
              tone={
                !result.cross_document.available
                  ? 'info'
                  : result.cross_document.mismatches.length > 0
                    ? 'warning'
                    : 'success'
              }
            />
            <Stat
              label="OCR Precision"
              value={
                result.ocr.name.confidence !== null
                  ? `${Math.round(result.ocr.name.confidence * 100)}%`
                  : 'N/A'
              }
              tone={
                result.ocr.name.confidence === null
                  ? 'info'
                  : result.ocr.name.confidence >= 0.7
                    ? 'success'
                    : result.ocr.name.confidence >= 0.4
                      ? 'warning'
                      : 'danger'
              }
            />
          </div>
        </div>
      </div>

      {/* Detailed Forensic Checks */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <CheckCard
          symbol="⬡"
          title="OCR Parsing & Attribute Extraction"
          status={
            result.ocr.name.value || result.ocr.document_number.value
              ? 'PARSED'
              : 'REVIEW'
          }
          tone={
            result.ocr.name.value || result.ocr.document_number.value
              ? 'success'
              : 'warning'
          }
          body={
            result.ocr.name.value || result.ocr.document_number.value
              ? 'Identity text attributes extracted successfully.'
              : 'OCR could not extract readable identity fields from document.'
          }
        >
          <div className="mt-3 pt-3 border-t border-signal-border/30">
            <FieldRow label="Name" value={result.ocr.name.value} />
            <FieldRow label="Date of Birth" value={result.ocr.dob.value} />
            <FieldRow
              label="Document No."
              value={result.ocr.document_number.value}
            />
            <FieldRow label="Gender" value={result.ocr.gender.value} />
            <FieldRow label="Address" value={result.ocr.address.value} />
          </div>
        </CheckCard>

        <CheckCard
          symbol="◎"
          title="Visual Structure & Anomaly Scan"
          status={
            result.document_indicators.anomaly_score < 30
              ? 'PASSED'
              : result.document_indicators.anomaly_score < 60
                ? 'REVIEW'
                : 'FLAGGED'
          }
          tone={
            result.document_indicators.anomaly_score < 30
              ? 'success'
              : result.document_indicators.anomaly_score < 60
                ? 'warning'
                : 'danger'
          }
          body={
            result.document_indicators.indicators.length === 0
              ? 'No suspicious digital edits or visual anomalies detected.'
              : result.document_indicators.indicators[0]
          }
        >
          {result.document_indicators.indicators.length > 0 && (
            <ul className="mt-3 pt-3 border-t border-signal-border/30 space-y-1.5 font-mono">
              {result.document_indicators.indicators.map((ind, i) => (
                <li
                  key={i}
                  className="text-xs text-text-secondary flex items-start gap-2"
                >
                  <span className="text-signal-gold">•</span>
                  <span>{ind}</span>
                </li>
              ))}
            </ul>
          )}
        </CheckCard>

        <CheckCard
          symbol="⬡"
          title="Biometric Face Similarity"
          status={
            result.face_similarity.status === 'unavailable'
              ? 'UNAVAILABLE'
              : result.face_similarity.status === 'strong'
                ? 'PASSED'
                : result.face_similarity.status === 'review'
                  ? 'REVIEW'
                  : 'FLAGGED'
          }
          tone={
            result.face_similarity.status === 'unavailable'
              ? 'info'
              : result.face_similarity.status === 'strong'
                ? 'success'
                : result.face_similarity.status === 'review'
                  ? 'warning'
                  : 'danger'
          }
          body={result.face_similarity.message}
        >
          <div className="mt-3 pt-3 border-t border-signal-border/30 text-xs text-text-muted">
            Biometric facial similarity match — zero-trust verification module.
          </div>
        </CheckCard>

        <CheckCard
          symbol="◔"
          title="Cross-Document Consistency"
          status={
            !result.cross_document.available
              ? 'UNAVAILABLE'
              : result.cross_document.mismatches.length > 0
                ? 'MISMATCH'
                : 'PASSED'
          }
          tone={
            !result.cross_document.available
              ? 'info'
              : result.cross_document.mismatches.length > 0
                ? 'warning'
                : 'success'
          }
          body={result.cross_document.message}
        >
          {result.cross_document.available && (
            <div className="mt-3 pt-3 border-t border-signal-border/30 space-y-1.5 text-xs font-mono">
              {result.cross_document.matches.map((m, i) => (
                <div key={`m-${i}`} className="flex items-start gap-2 text-text-secondary">
                  <CheckCircle2 className="w-3.5 h-3.5 text-signal-green mt-0.5 flex-shrink-0" />
                  <span>{m}</span>
                </div>
              ))}
              {result.cross_document.mismatches.map((m, i) => (
                <div key={`mm-${i}`} className="flex items-start gap-2 text-text-secondary">
                  <AlertTriangle className="w-3.5 h-3.5 text-signal-gold mt-0.5 flex-shrink-0" />
                  <span>{m}</span>
                </div>
              ))}
            </div>
          )}
        </CheckCard>
      </div>

      {/* Gemini AI Forensics Diagnostic Panel */}
      <div className="card p-6 sm:p-8 relative overflow-hidden border-signal-border/30">
        <div className="relative space-y-5">
          <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-widest text-signal-cyan">
            <Sparkles className="w-4 h-4 text-signal-cyan" />
            <span>GEMINI AI EXPLAINABLE FORENSICS</span>
          </div>

          <h2 className="text-xl sm:text-2xl font-extrabold text-text-main">
            Why is this identity{' '}
            {isHigh ? 'flagged as elevated threat risk?' : result.risk_level === 'REVIEW' ? 'recommended for manual audit?' : 'marked as verified?'}
          </h2>

          <p className="text-xs text-text-muted font-mono">
            {ai.source === 'gemini'
              ? 'Diagnostic reasoning synthesized by Gemini AI model using multi-modal pipeline telemetry.'
              : 'AI engine unavailable — showing rule-based heuristic findings.'}
          </p>

          {ai.findings.length === 0 ? (
            <div className="rounded-xl bg-signal-green/10 border border-signal-green/30 p-4 flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 text-signal-green flex-shrink-0 mt-0.5" />
              <div>
                <div className="font-bold text-text-main text-sm">
                  No suspicious indicators detected.
                </div>
                <p className="text-xs text-text-secondary mt-1 font-sans">
                  The document structural inspection, facial alignment, and OCR consistency satisfied security rules.
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-3 font-sans">
              {ai.findings.map((f, i) => {
                const Icon = SEVERITY_ICON[f.severity] || Info;
                return (
                  <div
                    key={i}
                    className={`rounded-xl border p-4 ${SEVERITY_BG[f.severity]}`}
                  >
                    <div className="flex items-start gap-3">
                      <Icon
                        className={`w-5 h-5 flex-shrink-0 mt-0.5 ${SEVERITY_COLOR[f.severity]}`}
                      />
                      <div className="flex-1 min-w-0">
                        <div className="font-bold text-text-main text-sm">
                          {f.title}
                        </div>
                        <p className="text-xs text-text-secondary mt-1 leading-relaxed">
                          {f.explanation}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {ai.recommendation && (
            <div className="rounded-xl border border-signal-cyan/30 bg-signal-bg p-4 font-mono">
              <div className="text-[10px] uppercase tracking-widest text-signal-cyan mb-1.5 flex items-center gap-1.5">
                <Cpu className="w-3.5 h-3.5" />
                <span>RECOMMENDED FORENSIC ACTION</span>
              </div>
              <p className="text-xs text-text-main leading-relaxed font-sans">
                {ai.recommendation}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
        <button
          type="button"
          onClick={() => navigate('/verify')}
          className="btn-primary text-sm shadow-glow"
        >
          <RotateCcw className="w-4 h-4" /> Run Another Verification
        </button>
        <Link to="/" className="btn-ghost text-sm inline-flex items-center justify-center">
          Return to Terminal Home
        </Link>
      </div>
    </div>
  );
}

function Stat({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone: 'success' | 'warning' | 'danger' | 'info';
}) {
  const colorMap: Record<string, string> = {
    success: 'text-signal-green',
    warning: 'text-signal-gold',
    danger: 'text-status-danger',
    info: 'text-signal-cyan',
  };
  return (
    <div className="rounded-xl bg-signal-bg border border-signal-border/40 p-3 font-mono">
      <div className="text-[10px] uppercase tracking-widest text-text-muted mb-1 truncate">
        {label}
      </div>
      <div className={`text-base font-bold ${colorMap[tone]}`}>{value}</div>
    </div>
  );
}

function CheckCard({
  symbol,
  title,
  status,
  tone,
  body,
  children,
}: {
  symbol: string;
  title: string;
  status: string;
  tone: 'success' | 'warning' | 'danger' | 'info';
  body: string;
  children?: React.ReactNode;
}) {
  const toneMap: Record<string, string> = {
    success: 'badge-success',
    warning: 'badge-warning',
    danger: 'badge-danger',
    info: 'badge-info',
  };
  return (
    <div className="card p-5 border-signal-border/30">
      <div className="flex items-start justify-between gap-3 mb-2 font-mono">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-signal-bg border border-signal-border flex items-center justify-center text-signal-cyan text-sm font-bold">
            {symbol}
          </div>
          <h3 className="text-sm font-bold text-text-main">{title}</h3>
        </div>
        <span className={`badge ${toneMap[tone]}`}>{status}</span>
      </div>
      <p className="text-xs text-text-secondary leading-relaxed font-sans">{body}</p>
      {children}
    </div>
  );
}
