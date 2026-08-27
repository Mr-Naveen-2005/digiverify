import type { AnalyzeResponse, VerificationType } from '../types';

const API_BASE = import.meta.env.VITE_API_BASE ?? '/api';

export interface AnalyzePayload {
  document: File;
  photo: File;
  verification_type: VerificationType;
  extra_documents?: File[];
}

export async function analyze(payload: AnalyzePayload): Promise<AnalyzeResponse> {
  const form = new FormData();
  form.append('document', payload.document);
  form.append('photo', payload.photo);
  form.append('verification_type', payload.verification_type);
  (payload.extra_documents || []).forEach((f) => form.append('extra_documents', f));

  const res = await fetch(`${API_BASE}/analyze`, {
    method: 'POST',
    body: form,
  });

  if (!res.ok) {
    let detail = `Request failed (${res.status})`;
    try {
      const data = await res.json();
      if (data?.detail) detail = data.detail;
    } catch {
      /* ignore */
    }
    throw new Error(detail);
  }
  return (await res.json()) as AnalyzeResponse;
}

export async function healthCheck(): Promise<{ status: string; openai: boolean }> {
  const res = await fetch(`${API_BASE}/health`);
  if (!res.ok) throw new Error('Backend unreachable');
  return res.json();
}
