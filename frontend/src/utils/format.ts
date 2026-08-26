import type { RiskLevel } from '../types';

export function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.min(Math.floor(Math.log(bytes) / Math.log(k)), sizes.length - 1);
  return `${(bytes / Math.pow(k, i)).toFixed(1)} ${sizes[i]}`;
}

export function isImage(file: File): boolean {
  return file.type.startsWith('image/');
}

export function isPdf(file: File): boolean {
  return file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');
}

export const ACCEPTED_DOC_TYPES = '.jpg,.jpeg,.png,.pdf';
export const ACCEPTED_DOC_MIMES = ['image/jpeg', 'image/png', 'application/pdf'];
export const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB

export function riskColor(level: RiskLevel): string {
  switch (level) {
    case 'LOW':
      return '#22C55E';
    case 'REVIEW':
      return '#F59E0B';
    case 'HIGH':
      return '#EF4444';
  }
}

export function riskLabel(level: RiskLevel): string {
  switch (level) {
    case 'LOW':
      return 'LOW RISK';
    case 'REVIEW':
      return 'REVIEW';
    case 'HIGH':
      return 'HIGH RISK';
  }
}
