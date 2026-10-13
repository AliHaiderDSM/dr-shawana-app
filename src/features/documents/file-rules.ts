import { formatSize } from '@/lib/format';

export const MAX_UPLOAD_BYTES = 10 * 1024 * 1024;

export const UPLOAD_TYPES = ['application/pdf', 'image/jpeg', 'image/png', 'image/webp'] as const;

export interface PickedFile {
  uri: string;
  name: string;
  mimeType: string;
  size: number | null;
}

const EXTENSION_TYPES: Record<string, string> = {
  pdf: 'application/pdf',
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  png: 'image/png',
  webp: 'image/webp',
};

export function normalizeType(name: string, mimeType: string | null | undefined) {
  const type = mimeType?.toLowerCase() === 'image/jpg' ? 'image/jpeg' : mimeType?.toLowerCase();
  if (type && (UPLOAD_TYPES as readonly string[]).includes(type)) return type;
  const ext = name.split('.').pop()?.toLowerCase() ?? '';
  return EXTENSION_TYPES[ext] ?? type ?? '';
}

export function validateFile(file: PickedFile) {
  if (!(UPLOAD_TYPES as readonly string[]).includes(file.mimeType)) {
    return 'Choose a PDF or a photo (JPG, PNG or WebP).';
  }
  if (file.size !== null && file.size > MAX_UPLOAD_BYTES) {
    return `This file is ${formatSize(file.size)}. The limit is ${formatSize(MAX_UPLOAD_BYTES)}.`;
  }
  return null;
}
