import type { FetchBaseQueryError } from '@reduxjs/toolkit/query';
import type { SerializedError } from '@reduxjs/toolkit';

export interface ApiErrorBody {
  error?: {
    code?: string;
    message?: string;
    details?: { path?: string; message?: string }[];
  };
}

type AnyError = FetchBaseQueryError | SerializedError | undefined | unknown;

function isFetchError(error: AnyError): error is FetchBaseQueryError {
  return typeof error === 'object' && error !== null && 'status' in error;
}

export function isOffline(error: AnyError) {
  return isFetchError(error) && (error.status === 'FETCH_ERROR' || error.status === 'TIMEOUT_ERROR');
}

export function errorStatus(error: AnyError) {
  return isFetchError(error) && typeof error.status === 'number' ? error.status : null;
}

export function errorMessage(error: AnyError, fallback = 'Something went wrong. Please try again.') {
  if (!error) return fallback;
  if (isOffline(error))
    return 'Could not reach the clinic server. Check your internet connection and try again.';
  if (isFetchError(error)) {
    const body = error.data as ApiErrorBody | undefined;
    const detail = body?.error?.details?.find((d) => d.message)?.message;
    if (error.status === 429) return body?.error?.message ?? 'Too many attempts. Please wait a few minutes.';
    if (typeof error.status === 'number' && error.status >= 500) {
      return 'The clinic server is not responding right now. Please try again shortly.';
    }
    return detail ?? body?.error?.message ?? fallback;
  }
  if (error instanceof Error) return error.message || fallback;
  return fallback;
}

export function fieldErrors(error: AnyError) {
  if (!isFetchError(error)) return {};
  const body = error.data as ApiErrorBody | undefined;
  const result: Record<string, string> = {};
  for (const detail of body?.error?.details ?? []) {
    const field = detail.path?.replace(/^body\./, '');
    if (field && detail.message && !result[field]) result[field] = detail.message;
  }
  return result;
}
