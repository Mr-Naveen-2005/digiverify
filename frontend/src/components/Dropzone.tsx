import { useRef, useState, type DragEvent, type ChangeEvent } from 'react';
import { Upload, FileText, Image as ImageIcon, X, ShieldCheck } from 'lucide-react';
import {
  ACCEPTED_DOC_TYPES,
  ACCEPTED_DOC_MIMES,
  MAX_FILE_SIZE,
  formatBytes,
  isImage,
  isPdf,
} from '../utils/format';

export interface DropzoneProps {
  label: string;
  subtitle: string;
  file: File | null;
  preview: string | null;
  onFile: (f: File | null) => void;
  error?: string | null;
}

export default function Dropzone({
  label,
  subtitle,
  file,
  preview,
  onFile,
  error,
}: DropzoneProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isActive, setIsActive] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  function validate(f: File): string | null {
    if (!ACCEPTED_DOC_MIMES.includes(f.type) && !isPdf(f)) {
      return 'Unsupported file format. Please upload JPG, PNG, or PDF.';
    }
    if (f.size > MAX_FILE_SIZE) {
      return 'File size exceeds maximum threshold (10 MB).';
    }
    return null;
  }

  function handleFiles(files: FileList | null) {
    if (!files || files.length === 0) return;
    const f = files[0];
    const err = validate(f);
    if (err) {
      setLocalError(err);
      onFile(null);
      return;
    }
    setLocalError(null);
    onFile(f);
  }

  function onDrop(e: DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setIsActive(false);
    handleFiles(e.dataTransfer.files);
  }

  function onChange(e: ChangeEvent<HTMLInputElement>) {
    handleFiles(e.target.files);
  }

  function clear() {
    onFile(null);
    setLocalError(null);
    if (inputRef.current) inputRef.current.value = '';
  }

  const displayError = error || localError;

  return (
    <div className="card p-6 border-signal-border/30 space-y-4 font-mono">
      <div className="flex items-start justify-between">
        <div>
          <h3 className="text-base font-bold text-text-main flex items-center gap-2">
            <span className="text-signal-green">⬡</span>
            {label}
          </h3>
          <p className="text-xs text-text-secondary mt-0.5 font-sans">{subtitle}</p>
        </div>
        {file && (
          <span className="badge badge-success flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5" /> STAGED
          </span>
        )}
      </div>

      {!file && (
        <div
          className={`dropzone ${isActive ? 'is-active' : ''}`}
          onClick={() => inputRef.current?.click()}
          onDragOver={(e) => {
            e.preventDefault();
            setIsActive(true);
          }}
          onDragLeave={() => setIsActive(false)}
          onDrop={onDrop}
          role="button"
          tabIndex={0}
        >
          {isActive && <div className="cyber-scanner-line" />}

          <input
            ref={inputRef}
            type="file"
            accept={ACCEPTED_DOC_TYPES}
            onChange={onChange}
            className="hidden"
          />
          <div className="w-12 h-12 mx-auto rounded-2xl bg-signal-green/10 border border-signal-green/30 flex items-center justify-center mb-3 shadow-glow">
            <Upload className="w-5 h-5 text-signal-green" />
          </div>
          <div className="text-sm font-semibold text-text-main">
            Drop file here or click to browse
          </div>
          <div className="text-[11px] text-text-muted mt-1.5">
            SUPPORTED: JPG · PNG · PDF (MAX 10 MB)
          </div>
        </div>
      )}

      {file && (
        <div className="rounded-xl border border-signal-green/40 bg-signal-bg p-3.5 shadow-glow">
          <div className="flex items-center gap-3">
            <div className="w-14 h-14 rounded-lg bg-signal-secondary border border-signal-border flex items-center justify-center overflow-hidden flex-shrink-0">
              {preview ? (
                <img
                  src={preview}
                  alt="preview"
                  className="w-full h-full object-cover"
                />
              ) : isPdf(file) ? (
                <FileText className="w-6 h-6 text-signal-cyan" />
              ) : isImage(file) ? (
                <ImageIcon className="w-6 h-6 text-signal-cyan" />
              ) : (
                <FileText className="w-6 h-6 text-signal-cyan" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-bold text-text-main truncate">
                {file.name}
              </div>
              <div className="text-[11px] text-text-muted mt-0.5">
                {file.type || 'DOCUMENT'} · {formatBytes(file.size)}
              </div>
              <div className="mt-2 flex items-center gap-3">
                <span className="text-[10px] text-signal-green flex items-center gap-1">
                  ● ENCRYPTED & STAGED
                </span>
                <button
                  type="button"
                  onClick={clear}
                  className="text-xs text-text-muted hover:text-status-danger transition-colors inline-flex items-center gap-1 ml-auto"
                >
                  <X className="w-3.5 h-3.5" /> Remove
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {displayError && (
        <div className="text-xs text-status-danger bg-status-danger/10 border border-status-danger/30 rounded-lg p-2.5 flex items-center gap-2">
          <span>⚠️ {displayError}</span>
        </div>
      )}
    </div>
  );
}
