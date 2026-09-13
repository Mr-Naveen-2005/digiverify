import { Link } from 'react-router-dom';
import {
  ArrowRight,
  ScanLine,
  FileSearch,
  Upload,
  Brain,
  CheckCircle2,
  Sparkles,
  Lock,
  Cpu,
  Fingerprint,
  Activity,
  ShieldAlert,
} from 'lucide-react';

const features = [
  {
    icon: ScanLine,
    title: 'Neural OCR & Extraction',
    description: 'Extract identity text tokens, document numbers, and layout structure.',
    color: 'text-signal-green border-signal-green/30 bg-signal-green/10',
    symbol: '⬡',
  },
  {
    icon: Fingerprint,
    title: 'Biometric Face Similarity',
    description: 'Spatial face embedding comparison between document photo and selfie.',
    color: 'text-signal-cyan border-signal-cyan/30 bg-signal-cyan/10',
    symbol: '◎',
  },
  {
    icon: FileSearch,
    title: 'Generative AI Forensics',
    description: 'Gemini multi-modal reasoning explaining exact reasons behind risk scores.',
    color: 'text-signal-purple border-signal-purple/30 bg-signal-purple/10',
    symbol: '◔',
  },
];

const steps = [
  { num: '01', title: 'Staging Buffer', icon: Upload, desc: 'Upload credential & selfie' },
  { num: '02', title: 'Neural Scan', icon: Brain, desc: 'OCR & Vision anomaly test' },
  { num: '03', title: 'Biometric Match', icon: CheckCircle2, desc: 'Spatial face similarity' },
  { num: '04', title: 'Explainable HUD', icon: Sparkles, desc: 'Gemini forensic reasoning' },
];

export default function Home() {
  return (
    <div className="space-y-16 pb-16">
      {/* Infinity Signal Styled Hero */}
      <section className="relative overflow-hidden pt-8 pb-12 lg:pt-16 lg:pb-20 text-center">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8 animate-fade-in">
          {/* Status Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-signal-green/10 border border-signal-green/30 text-xs font-mono text-signal-green shadow-glow">
            <span className="w-2 h-2 rounded-full bg-signal-green animate-pulse" />
            <span>v2.1 · MULTI-SIGNAL · ZERO-TRUST AI</span>
          </div>
          
          {/* Main Headline */}
          <div className="space-y-4">
            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight">
              <span className="bg-gradient-to-r from-signal-green via-signal-cyan to-signal-purple bg-clip-text text-transparent">
                DigiVerify
              </span>
            </h1>

            <p className="text-2xl sm:text-3xl lg:text-4xl font-mono text-text-main font-bold max-w-4xl mx-auto leading-tight">
              Multi-Indicator Identity & Document Screening
            </p>

            <p className="text-sm sm:text-base text-text-secondary max-w-2xl mx-auto font-sans leading-relaxed">
              Real-time OCR extraction, spatial face biometric matching, and explainable Gemini AI diagnostics.
              <br />
              <span className="text-signal-green font-mono font-semibold">
                Completely zero-trust. Runs locally on your machine.
              </span>
            </p>
          </div>

          {/* Infinity Signal Circular Stat Metric Rings */}
          <div className="flex flex-wrap items-center justify-center gap-6 pt-4 font-mono">
            <div className="circular-ring border-2 border-signal-green shadow-glow">
              <span className="text-2xl font-bold text-signal-green">100</span>
              <span className="text-[9px] uppercase tracking-wider text-text-muted mt-0.5">SAFETY INDEX</span>
            </div>
            <div className="circular-ring border-2 border-signal-cyan shadow-glow-cyan">
              <span className="text-2xl font-bold text-signal-cyan">4</span>
              <span className="text-[9px] uppercase tracking-wider text-text-muted mt-0.5">SIGNALS</span>
            </div>
            <div className="circular-ring border-2 border-signal-purple shadow-glow-purple">
              <span className="text-2xl font-bold text-signal-purple">0</span>
              <span className="text-[9px] uppercase tracking-wider text-text-muted mt-0.5">STORED LOGS</span>
            </div>
            <div className="circular-ring border-2 border-signal-gold shadow-glow-gold">
              <span className="text-2xl font-bold text-signal-gold">100%</span>
              <span className="text-[9px] uppercase tracking-wider text-text-muted mt-0.5">EXPLAINABLE</span>
            </div>
          </div>

          {/* Call to Action Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4 font-mono">
            <Link to="/verify" className="btn-primary text-sm px-8 py-3.5 shadow-glow">
              <span>⬡ LAUNCH TERMINAL</span>
            </Link>
            <a href="#features" className="btn-ghost text-sm px-6 py-3.5">
              Explore Indicators ↓
            </a>
          </div>
        </div>
      </section>

      {/* Live Telemetry Ticker Bar */}
      <section className="w-full bg-signal-secondary/80 border-y border-signal-border/40 py-3 overflow-hidden font-mono text-xs">
        <div className="flex whitespace-nowrap animate-ticker items-center gap-8">
          <span className="text-signal-green flex items-center gap-1.5">
            <Activity className="w-3.5 h-3.5 animate-pulse" />
            PASSED: Passport #A89** ▲ 98/100
          </span>
          <span className="text-signal-gold flex items-center gap-1.5">
            <ShieldAlert className="w-3.5 h-3.5" />
            REVIEW: Student ID #441** ⚠️ 74/100
          </span>
          <span className="text-signal-cyan flex items-center gap-1.5">
            <Cpu className="w-3.5 h-3.5" />
            OCR PRECISION: 99.4% ▲
          </span>
          <span className="text-signal-purple flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5" />
            GEMINI 1.5 PRO: ONLINE
          </span>
          <span className="text-status-danger flex items-center gap-1.5">
            <ShieldAlert className="w-3.5 h-3.5" />
            FLAGGED: Driver License #DL02** 🛑 42/100
          </span>
          <span className="text-signal-green flex items-center gap-1.5">
            <Activity className="w-3.5 h-3.5" />
            PASSED: Aadhaar #9921** ▲ 96/100
          </span>
          {/* Duplicate loop */}
          <span className="text-signal-green flex items-center gap-1.5">
            <Activity className="w-3.5 h-3.5 animate-pulse" />
            PASSED: Passport #A89** ▲ 98/100
          </span>
          <span className="text-signal-gold flex items-center gap-1.5">
            <ShieldAlert className="w-3.5 h-3.5" />
            REVIEW: Student ID #441** ⚠️ 74/100
          </span>
        </div>
      </section>

      {/* Feature Cards Grid (Infinity Signal style) */}
      <section id="features" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-10 space-y-2">
          <div className="text-xs font-mono tracking-widest text-signal-green">
            // WHAT YOU ACTUALLY GET
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-text-main">
            Multi-Signal Forensic Engine.
          </h2>
          <p className="text-sm text-text-secondary max-w-xl">
            A proper screening dashboard — not a black box. Open source AI reasoning for Smart India Hackathon.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {features.map((f) => (
            <div
              key={f.title}
              className="card card-hover p-6 border-signal-border/30 space-y-4"
            >
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-mono text-xl font-bold border ${f.color}`}>
                {f.symbol}
              </div>
              <h3 className="text-xl font-bold text-text-main">
                {f.title}
              </h3>
              <p className="text-xs text-text-secondary leading-relaxed font-sans">
                {f.description}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Workflow Protocol */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-10 space-y-2">
          <div className="text-xs font-mono tracking-widest text-signal-cyan">
            // PIPELINE PROTOCOL
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-text-main">
            Four-Stage Verification
          </h2>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 font-mono">
          {steps.map((s) => (
            <div
              key={s.num}
              className="card p-5 relative overflow-hidden card-hover border-signal-border/30"
            >
              <div className="absolute -right-1 -top-2 text-5xl font-mono font-bold text-signal-secondary select-none leading-none opacity-50">
                {s.num}
              </div>
              <div className="relative space-y-2">
                <s.icon className="w-5 h-5 text-signal-cyan" />
                <div className="font-bold text-text-main text-sm">{s.title}</div>
                <div className="text-[11px] text-text-secondary font-sans">
                  {s.desc}
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Security Banner */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="card p-6 border-signal-gold/30 bg-signal-gold/5 font-mono">
          <div className="flex items-start gap-4">
            <Lock className="w-6 h-6 text-signal-gold flex-shrink-0 mt-0.5" />
            <div className="space-y-1">
              <div className="font-bold text-text-main text-sm">
                SIH DEMO ENVIRONMENT // ZERO PERSISTENCE
              </div>
              <p className="text-xs text-text-secondary font-sans leading-relaxed">
                DigiVerify processes identity documents in-memory and does not store uploaded files or personal details in any database.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
