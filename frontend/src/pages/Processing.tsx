import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Check, Loader2, AlertCircle, ArrowRight, Cpu } from 'lucide-react';
import { analyze } from '../services/api';
import type { AnalyzeResponse, VerificationType } from '../types';

interface Step {
  id: string;
  label: string;
  description: string;
}

const STEPS: Step[] = [
  { id: 'upload', label: 'Credential Staging', description: 'Files received and zero-trust payload validated' },
  { id: 'type', label: 'Category Classifier', description: 'Detecting credential domain layout' },
  { id: 'ocr', label: 'Neural OCR Extraction', description: 'Parsing identity text tokens' },
  { id: 'indicators', label: 'Visual Tamper Inspection', description: 'Evaluating OpenCV structural anomaly matrix' },
  { id: 'photo', label: 'Biometric Face Isolation', description: 'Detecting portrait region and feature landmarks' },
  { id: 'face', label: 'Spatial Sim Scoring', description: 'Calculating facial similarity matrix' },
  { id: 'risk', label: 'Safety Index Calculation', description: 'Aggregating weighted signal evidence' },
  { id: 'ai', label: 'Gemini Forensic Synthesis', description: 'Generating explainable audit explanation' },
];

type StepState = 'pending' | 'active' | 'done' | 'error';

interface FilesBag {
  document: File;
  photo: File;
  verificationType: VerificationType;
}

export default function Processing() {
  const navigate = useNavigate();
  const [states, setStates] = useState<StepState[]>(
    STEPS.map(() => 'pending'),
  );
  const [messages, setMessages] = useState<string[]>(STEPS.map(() => ''));
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<AnalyzeResponse | null>(null);
  const startedRef = useRef(false);

  useEffect(() => {
    if (startedRef.current) return;
    startedRef.current = true;

    const files = (window as unknown as { __digiverifyFiles?: FilesBag })
      .__digiverifyFiles;

    if (!files) {
      setError('No document payload received. Returning to terminal.');
      setStates(STEPS.map(() => 'error'));
      return;
    }

    run(files);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function setStep(i: number, s: StepState, msg?: string) {
    setStates((prev) => prev.map((p, idx) => (idx === i ? s : p)));
    if (msg !== undefined) {
      setMessages((prev) => prev.map((m, idx) => (idx === i ? msg : m)));
    }
  }

  async function run(files: FilesBag) {
    try {
      // Step 0: document uploaded
      setStep(0, 'active', 'Receiving security payload…');
      await tick();
      setStep(0, 'done', `${files.document.name} (${(files.document.size / 1024).toFixed(0)} KB)`);

      // Step 1: type analyzed
      setStep(1, 'active', 'Classifying document template…');
      await tick(450);
      setStep(1, 'done', 'Template Classified');

      // Trigger backend
      const apiPromise = analyze({
        document: files.document,
        photo: files.photo,
        verification_type: files.verificationType,
      });

      // Step 2: OCR
      setStep(2, 'active', 'Running OCR extraction…');
      await tick(600);
      setStep(2, 'done', 'Attributes Extracted');

      // Step 3: indicators
      setStep(3, 'active', 'Scanning image structure…');
      await tick(700);
      setStep(3, 'done', 'Tamper Analysis Complete');

      // Step 4: photo analyzed
      setStep(4, 'active', 'Isolating portrait area…');
      await tick(500);
      setStep(4, 'done', 'Portrait Located');

      // Step 5: face comparison
      setStep(5, 'active', 'Comparing facial embedding…');
      await tick(500);
      setStep(5, 'done', 'Biometric Sim Scored');

      // Step 6: risk
      setStep(6, 'active', 'Calculating Safety Index…');
      const response = await apiPromise;
      setResult(response);
      setStep(6, 'done', `Index ${response.risk_score}/100`);

      // Step 7: AI explanation
      setStep(7, 'active', 'Formulating Gemini Forensics…');
      await tick(400);
      setStep(7, 'done', 'Forensics Ready');

      // Brief pause then navigate
      await tick(500);
      sessionStorage.setItem('digiverify.result', JSON.stringify(response));
      navigate('/result');
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Processing failure.';
      setError(msg);
      setStates((prev) => prev.map((s) => (s === 'pending' ? 'error' : s)));
    }
  }

  function tick(ms = 350) {
    return new Promise<void>((r) => setTimeout(r, ms));
  }

  const completedCount = states.filter((s) => s === 'done').length;
  const percent = Math.round((completedCount / STEPS.length) * 100);

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12 font-mono">
      <div className="text-center mb-8 animate-fade-in space-y-3">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-signal-green/10 border border-signal-green/40 mb-2 shadow-glow">
          <Cpu className="w-7 h-7 text-signal-green animate-pulse" />
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-text-main">
          <span>Executing Security Screening</span>
        </h1>
        <p className="text-xs font-mono text-text-muted max-w-md mx-auto">
          PIPELINE: OCR → VISION ANOMALY → BIOMETRIC SIM → GEMINI FORENSICS
        </p>
      </div>

      <div className="card p-6 sm:p-8 border-signal-border/30">
        {/* Infinity Progress bar */}
        <div className="mb-6 space-y-2">
          <div className="flex items-center justify-between text-xs text-text-secondary">
            <span className="flex items-center gap-1.5 text-signal-green font-bold">
              <span className="w-2 h-2 rounded-full bg-signal-green animate-ping" />
              LIVE TELEMETRY LOGS
            </span>
            <span className="text-signal-cyan font-bold">
              {completedCount} / {STEPS.length} STEPS · {percent}%
            </span>
          </div>
          <div className="h-2.5 w-full bg-signal-bg rounded-full overflow-hidden border border-signal-border p-0.5">
            <div
              className="h-full bg-gradient-to-r from-signal-green via-signal-cyan to-signal-purple rounded-full transition-all duration-500 shadow-glow"
              style={{ width: `${percent}%` }}
            />
          </div>
        </div>

        {/* Steps */}
        <ol className="space-y-3 font-mono">
          {STEPS.map((s, i) => {
            const st = states[i];
            return (
              <li
                key={s.id}
                className="flex items-start gap-3 p-3 rounded-xl border border-signal-border/20 bg-signal-bg/70 animate-fade-in"
                style={{ animationDelay: `${i * 60}ms` }}
              >
                <div
                  className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 border ${
                    st === 'done'
                      ? 'bg-signal-green/15 border-signal-green/40 text-signal-green'
                      : st === 'active'
                        ? 'bg-signal-cyan/15 border-signal-cyan text-signal-cyan shadow-glow-cyan'
                        : st === 'error'
                          ? 'bg-status-danger/15 border-status-danger/40 text-status-danger'
                          : 'bg-signal-secondary border-signal-border/30 text-text-muted'
                  }`}
                >
                  {st === 'done' ? (
                    <Check className="w-4 h-4" strokeWidth={3} />
                  ) : st === 'active' ? (
                    <Loader2 className="w-4 h-4 animate-spin text-signal-cyan" />
                  ) : st === 'error' ? (
                    <AlertCircle className="w-4 h-4" />
                  ) : (
                    <span className="text-xs">{i + 1}</span>
                  )}
                </div>
                <div className="flex-1 min-w-0 pt-0.5">
                  <div
                    className={`text-xs font-bold ${
                      st === 'pending' ? 'text-text-muted' : 'text-text-main'
                    }`}
                  >
                    {s.label}
                  </div>
                  <div className="text-[11px] text-text-secondary mt-0.5 truncate font-sans">
                    {st === 'error' && messages[i]
                      ? messages[i]
                      : st === 'done' && messages[i]
                        ? messages[i]
                        : s.description}
                  </div>
                </div>
              </li>
            );
          })}
        </ol>

        {error && (
          <div className="mt-5 card p-4 border-status-danger/40 bg-status-danger/10">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-status-danger flex-shrink-0 mt-0.5" />
              <div>
                <div className="text-sm font-bold text-text-main font-mono">
                  SCREENING ABORTED
                </div>
                <p className="text-xs text-text-secondary mt-1">{error}</p>
                <button
                  type="button"
                  onClick={() => navigate('/verify')}
                  className="btn-ghost mt-3 text-xs font-mono"
                >
                  Return to Screening Terminal
                </button>
              </div>
            </div>
          </div>
        )}

        {result && !error && (
          <div className="mt-5 text-center text-xs font-mono text-signal-green flex items-center justify-center gap-2">
            <Loader2 className="w-4 h-4 animate-spin text-signal-green" />
            <span>FINALIZING SECURITY DASHBOARD…</span>
            <ArrowRight className="w-4 h-4" />
          </div>
        )}
      </div>
    </div>
  );
}
