import { File, UploadType, type UploadResult } from 'expo-file-system';
import { refreshSession, SESSION_ENDED } from '@/services/api/base-api';
import { API_URL } from '@/lib/config';
import type { PickedFile } from './file-rules';

export class UploadError extends Error {
  constructor(
    message: string,
    readonly sessionEnded = false,
  ) {
    super(message);
  }
}

function messageOf(result: UploadResult) {
  try {
    const body = JSON.parse(result.body) as { error?: { message?: string } };
    if (body.error?.message) return body.error.message;
  } catch {
    return 'The upload failed. Please try again.';
  }
  return 'The upload failed. Please try again.';
}

export interface UploadHandle {
  promise: Promise<void>;
  cancel: () => void;
}

export function uploadDocument(options: {
  file: PickedFile;
  title: string;
  accessToken: string | null;
  onToken: (token: string) => void;
  onProgress: (fraction: number) => void;
}): UploadHandle {
  let cancelled = false;
  let cancelTask: (() => void) | null = null;

  const attempt = async (token: string | null) => {
    const task = new File(options.file.uri).createUploadTask(`${API_URL}/patient/documents`, {
      httpMethod: 'POST',
      uploadType: UploadType.MULTIPART,
      fieldName: 'files',
      mimeType: options.file.mimeType,
      parameters: options.title ? { title: options.title } : {},
      headers: token ? { Authorization: `Bearer ${token}`, Accept: 'application/json' } : {},
      sessionType: 'foreground',
      onProgress: ({ bytesSent, totalBytes }) => {
        if (totalBytes > 0) options.onProgress(Math.min(1, bytesSent / totalBytes));
      },
    });
    cancelTask = () => task.cancel();
    try {
      return await task.uploadAsync();
    } finally {
      cancelTask = null;
      task.release();
    }
  };

  const promise = (async () => {
    let result: UploadResult;
    try {
      result = await attempt(options.accessToken);
      if (result.status === 401 && !cancelled) {
        const refreshed = await refreshSession();
        if (refreshed.kind === 'expired') throw new UploadError(SESSION_ENDED, true);
        if (refreshed.kind === 'offline')
          throw new UploadError('No internet connection. Try again when you are online.');
        options.onToken(refreshed.session.accessToken);
        options.onProgress(0);
        result = await attempt(refreshed.session.accessToken);
      }
    } catch (error) {
      if (error instanceof UploadError) throw error;
      if (cancelled) throw new UploadError('Upload cancelled.');
      throw new UploadError('The upload could not finish. Check your connection and try again.');
    }
    if (result.status === 401) throw new UploadError(SESSION_ENDED, true);
    if (result.status < 200 || result.status >= 300) throw new UploadError(messageOf(result));
  })();

  return {
    promise,
    cancel: () => {
      cancelled = true;
      cancelTask?.();
    },
  };
}
