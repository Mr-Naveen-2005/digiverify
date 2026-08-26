import { Link, useLocation } from 'react-router-dom';
import { ShieldCheck, Activity } from 'lucide-react';
import type { ReactNode } from 'react';

export default function Layout({ children }: { children: ReactNode }) {
  const location = useLocation();
  const isActive = (path: string) =>
    location.pathname === path
      ? 'text-signal-green font-semibold bg-signal-green/10 border border-signal-green/30'
      : 'text-text-secondary hover:text-text-main hover:bg-bg-card/50 border border-transparent';

  return (
    <div className="min-h-screen flex flex-col bg-secure-intel relative">
      {/* Infinity Signal Floating Pill Header */}
      <header className="sticky top-4 z-50 px-4 sm:px-6 lg:px-8 mb-4">
        <div className="max-w-5xl mx-auto pill-header px-4 sm:px-6 py-2.5 flex items-center justify-between">
          {/* Logo Brand */}
          <Link to="/" className="flex items-center gap-2.5 group">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-signal-green via-signal-cyan to-signal-purple p-0.5 shadow-glow group-hover:scale-105 transition-transform">
              <div className="w-full h-full bg-signal-bg rounded-[7px] flex items-center justify-center">
                <ShieldCheck className="w-4 h-4 text-signal-green" />
              </div>
            </div>
            <div className="font-mono text-sm tracking-widest text-text-main font-bold flex items-center gap-2">
              <span>DIGIVERIFY</span>
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded-full bg-signal-green/10 text-signal-green border border-signal-green/30">
                v2.1
              </span>
            </div>
          </Link>

          {/* Navigation Links */}
          <nav className="flex items-center gap-1 sm:gap-2 font-mono text-xs">
            <Link
              to="/"
              className={`px-3 py-1.5 rounded-full transition-all ${isActive('/')}`}
            >
              Home
            </Link>
            <Link
              to="/verify"
              className={`px-3 py-1.5 rounded-full transition-all ${isActive('/verify')}`}
            >
              Terminal
            </Link>
          </nav>

          {/* Operational Telemetry Badge */}
          <div className="hidden sm:flex items-center gap-2 text-[11px] font-mono text-text-muted">
            <Activity className="w-3.5 h-3.5 text-signal-green animate-pulse" />
            <span className="text-signal-green">ONLINE</span>
          </div>
        </div>
      </header>

      <main className="flex-1">{children}</main>

      <footer className="border-t border-signal-border/40 bg-signal-secondary/80 mt-16 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex flex-col sm:flex-row items-center justify-between gap-4 font-mono text-xs">
          <div className="flex items-center gap-2 text-text-muted">
            <span className="w-2 h-2 rounded-full bg-signal-green" />
            <span className="font-semibold text-text-main">DigiVerify Signal Engine</span> ·{' '}
            <span>Multi-Indicator Identity Screening</span>
          </div>
          <div className="text-text-muted">
            SIH Demonstration Prototype · Runs Locally on Your Machine
          </div>
        </div>
      </footer>
    </div>
  );
}
