import type { BaseQueryApi, FetchBaseQueryError } from '@reduxjs/toolkit/query/react';
import { createUploadTask, FileSystemUploadType } from 'expo-file-system/legacy';
import { API_URL } from '@/lib/config';
import type { UploadableFile } from '@/types/api';

export const UPLOAD_TIMEOUT_MS = 120_000;

export interface UploadArgs {
  url: string;
  upload: { field: string; file: UploadableFile; fields?: Record<string, string> };
}

export const isUpload = (args: unknown): args is UploadArgs =>
  typeof args === 'object' && args !== null && 'upload' in args;

export const fileUpload = (
  url: string,
  field: string,
  file: UploadableFile,
  fields: Record<string, string> = {},
): UploadArgs => ({ url, upload: { field, file, fields } });

const parse = (body: string) => {
  try {
    return JSON.parse(body) as unknown;
  } catch {
    return body;
  }
};

export async function uploadQuery(
  { url, upload }: UploadArgs,
  api: BaseQueryApi,
  token: string | null,
): Promise<{ data: unknown } | { error: FetchBaseQueryError }> {
  const task = createUploadTask(`${API_URL}${url}`, upload.file.uri, {
    httpMethod: 'POST',
    uploadType: FileSystemUploadType.MULTIPART,
    fieldName: upload.field,
    mimeType: upload.file.mimeType,
    parameters: upload.fields ?? {},
    headers: { accept: 'application/json', ...(token ? { authorization: `Bearer ${token}` } : {}) },
  });
  let timedOut = false;
  const cancel = () => void task.cancelAsync().catch(() => undefined);
  const timer = setTimeout(() => {
    timedOut = true;
    cancel();
  }, UPLOAD_TIMEOUT_MS);
  api.signal.addEventListener('abort', cancel);
  try {
    const result = await task.uploadAsync();
    if (!result) {
      return {
        error: timedOut
          ? { status: 'TIMEOUT_ERROR', error: 'The upload took too long' }
          : { status: 'CUSTOM_ERROR', error: 'Upload cancelled' },
      };
    }
    const data = parse(result.body);
    return result.status >= 200 && result.status < 300
      ? { data }
      : { error: { status: result.status, data } };
  } catch (error) {
    return { error: { status: 'FETCH_ERROR', error: String(error) } };
  } finally {
    clearTimeout(timer);
    api.signal.removeEventListener('abort', cancel);
  }
}
