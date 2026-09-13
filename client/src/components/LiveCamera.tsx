import React, { useRef, useState, useEffect } from 'react';
import { Camera, RefreshCw, CheckCircle2, XCircle } from 'lucide-react';

interface LiveCameraProps {
  onCapture: (blob: Blob) => void;
  label: string;
  subtitle: string;
}

export default function LiveCamera({ onCapture, label, subtitle }: LiveCameraProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [isCaptured, setIsCaptured] = useState(false);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function startCamera() {
    setError(null);
    try {
      const s = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: 1280, height: 720 }
      });
      setStream(s);
      if (videoRef.current) {
        videoRef.current.srcObject = s;
      }
    } catch (err) {
      setError('Camera access denied or not found.');
      console.error(err);
    }
  }

  async function capture() {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.drawImage(video, 0, 0);

    canvas.toBlob((blob) => {
      if (blob) {
        const url = URL.createObjectURL(blob);
        setCapturedImage(url);
        onCapture(blob);
        setIsCaptured(true);
        stopCamera();
      }
    }, 'image/jpeg', 0.95);
  }

  function stopCamera() {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
  }

  useEffect(() => {
    startCamera();
    return () => stopCamera();
  }, []);

  return (
    <div className="card p-6 border-signal-border/30 space-y-4 font-mono">
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-xl bg-signal-cyan/10 border border-signal-cyan/30 flex items-center justify-center flex-shrink-0">
          <Camera className="w-5 h-5 text-signal-cyan" />
        </div>
        <div>
          <h3 className="text-base font-bold text-text-main">{label}</h3>
          <p className="text-xs text-text-secondary mt-0.5 font-sans">{subtitle}</p>
        </div>
      </div>

      <div className="relative aspect-video bg-black rounded-2xl overflow-hidden border border-signal-border/40 shadow-inner">
        {!isCaptured ? (
          <>
            <video
              ref={videoRef}
              autoPlay
              playsInline
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 pointer-events-none border-[20px] border-transparent border-t-signal-cyan/20 border-b-signal-cyan/20"></div>
            {error && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/60 text-status-danger text-xs p-4 text-center">
                {error}
              </div>
            )}
          </>
        ) : (
          <div className="relative w-full h-full">
            <img
              src={capturedImage || ''}
              className="w-full h-full object-cover opacity-50"
              alt="Captured biometric reference"
            />
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="bg-signal-green/20 text-signal-green px-4 py-2 rounded-full border border-signal-green/50 flex items-center gap-2 text-xs font-bold">
                <CheckCircle2 className="w-4 h-4" /> CAPTURED
              </div>
            </div>
          </div>
        )}
        {/* Hidden canvas for capture processing */}
        <canvas ref={canvasRef} className="hidden" />
      </div>

      <div className="flex gap-3">
        {!isCaptured ? (
          <button
            type="button"
            onClick={capture}
            className="btn-primary w-full py-3 text-sm flex items-center justify-center gap-2 shadow-glow"
          >
            <Camera className="w-4 h-4" /> CAPTURE LIVE BIO-REF
          </button>
        ) : (
          <button
            type="button"
            onClick={() => {
              setIsCaptured(false);
              startCamera();
            }}
            className="btn-ghost w-full py-3 text-sm flex items-center justify-center gap-2 border-signal-border/40"
          >
            <RefreshCw className="w-4 h-4" /> RETAKE PHOTO
          </button>
        )}
      </div>
    </div>
  );
}
