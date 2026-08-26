import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FileText,
  ChevronDown,
  AlertTriangle,
  Lock,
} from 'lucide-react';
import Dropzone from '../components/Dropzone';
import type { VerificationType } from '../types';

const VERIFICATION_TYPES: VerificationType[] = [
  'General Identity Verification',
  'Hostel Verification',
  'HR Verification',
  'Student Verification',
  'Client Verification',
];

export default function Verify() {
  const navigate = useNavigate();
  const [document, setDocument] = useState<File | null>(null);
  const [photo, setPhoto] = useState<File | null>(null);
  const [verificationType, setVerificationType] =
    useState<VerificationType>('General Identity Verification');
  const [docPreview, setDocPreview] = useState<string | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!document) {
      setDocPreview(null);
      return;
    }
    if (document.type.startsWith('image/')) {
      const url = URL.createObjectURL(document);
      setDocPreview(url);
      return () => URL.revokeObjectURL(url);
    }
    setDocPreview(null);
  }, [document]);

  useEffect(() => {
    if (!photo) {
      setPhotoPreview(null);
      return;
    }
    const url = URL.createObjectURL(photo);
    setPhotoPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [photo]);

  const canStart = useMemo(
    () => !!document && !!photo && !error,
    [document, photo, error],
  );

  async function start() {
    if (!document || !photo) {
      setError('Please upload both an identity document and a face photograph.');
      return;
    }
    // Stash file references for the Processing page to pick up.
    const files = { document, photo, verificationType };
    (window as unknown as { __digiverifyFiles?: typeof files }).__digiverifyFiles =
      files;
    navigate('/processing');
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8 font-mono">
      <div className="border-b border-signal-border/40 pb-6 space-y-2">
        <div className="text-xs tracking-widest text-signal-green">
          // TERMINAL INPUT BUFFER
        </div>
        <h1 className="text-3xl font-extrabold text-text-main flex items-center gap-3">
          <span>Screening Terminal</span>
          <span className="text-xs px-3 py-1 rounded-full bg-signal-cyan/10 text-signal-cyan border border-signal-cyan/30">
            ZERO-TRUST ENCRYPTED
          </span>
        </h1>
        <p className="text-xs text-text-secondary max-w-3xl font-sans leading-relaxed">
          Stage identity document and photo capture files into the in-memory screening pipeline.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Dropzone
          label="Primary Credential Document"
          subtitle="Passport, Aadhaar, Student ID or government photo identity credential."
          file={document}
          preview={docPreview}
          onFile={setDocument}
        />
        <Dropzone
          label="Facial Biometric Reference"
          subtitle="Selfie photo capture for spatial embedding & similarity comparison."
          file={photo}
          preview={photoPreview}
          onFile={setPhoto}
        />
      </div>

      <div className="card p-6 border-signal-border/30 space-y-4">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-signal-cyan/10 border border-signal-cyan/30 flex items-center justify-center flex-shrink-0">
            <FileText className="w-5 h-5 text-signal-cyan" />
          </div>
          <div>
            <h3 className="text-base font-bold text-text-main flex items-center gap-2">
              <span>Verification Profile Domain</span>
            </h3>
            <p className="text-xs text-text-secondary mt-0.5 font-sans">
              Select verification evaluation ruleset.
            </p>
          </div>
        </div>
        <div className="relative">
          <select
            className="input font-mono appearance-none pr-10 bg-signal-bg text-sm"
            value={verificationType}
            onChange={(e) =>
              setVerificationType(e.target.value as VerificationType)
            }
          >
            {VERIFICATION_TYPES.map((t) => (
              <option key={t} value={t} className="bg-signal-secondary">
                {t}
              </option>
            ))}
          </select>
          <ChevronDown className="w-4 h-4 text-text-secondary absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
        </div>
      </div>

      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pt-2">
        <div className="text-xs text-text-muted flex items-center gap-2">
          <Lock className="w-4 h-4 text-signal-green" />
          <span>ZERO DATA PERSISTENCE // DIRECT TELEMETRY SCAN</span>
        </div>
        <button
          type="button"
          disabled={!canStart}
          onClick={start}
          className="btn-primary text-sm w-full sm:w-auto px-8 py-3.5 shadow-glow"
        >
          <span>⬡ INITIATE SECURITY SCREENING</span>
        </button>
      </div>

      {error && (
        <div className="card p-4 flex items-start gap-3 border-status-danger/40 bg-status-danger/10">
          <AlertTriangle className="w-4 h-4 text-status-danger flex-shrink-0 mt-0.5" />
          <div className="text-xs text-status-danger font-mono">{error}</div>
        </div>
      )}
    </div>
  );
}
