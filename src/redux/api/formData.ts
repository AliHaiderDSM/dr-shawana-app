import type { UploadableFile } from '@/types/api';

export const UPLOAD_TIMEOUT_MS = 120_000;

export function fileFormData(fileField: string, file: UploadableFile, fields: Record<string, string> = {}) {
  const form = new FormData();
  for (const [key, value] of Object.entries(fields)) form.append(key, value);
  form.append(fileField, { uri: file.uri, name: file.name, type: file.mimeType } as unknown as Blob);
  return form;
}
