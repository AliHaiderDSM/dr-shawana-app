import {
  createApi,
  fetchBaseQuery,
  type BaseQueryFn,
  type FetchArgs,
  type FetchBaseQueryError,
} from '@reduxjs/toolkit/query/react';
import { signedOut, tokenRefreshed } from '../features/auth/authSlice';
import { sessionStorage } from '../features/auth/storage';
import { API_URL } from '@/lib/config';
import type { Envelope } from '@/types/api';
import type { Session } from '../features/auth/types';
import { TAG_TYPES } from './tagTypes';

interface AuthRoot {
  auth: { accessToken: string | null };
}

export const SESSION_ENDED = 'Your session has ended. Ask the clinic for a new code to log in again.';

const rawBaseQuery = fetchBaseQuery({
  baseUrl: API_URL,
  timeout: 30_000,
  prepareHeaders: (headers, { getState }) => {
    const token = (getState() as AuthRoot).auth.accessToken;
    if (token && !headers.has('authorization')) headers.set('authorization', `Bearer ${token}`);
    headers.set('accept', 'application/json');
    return headers;
  },
});

export type RefreshResult = { kind: 'ok'; session: Session } | { kind: 'expired' } | { kind: 'offline' };

let pending: Promise<RefreshResult> | null = null;

async function requestRefresh(): Promise<RefreshResult> {
  const refreshToken = await sessionStorage.getRefreshToken();
  if (!refreshToken) return { kind: 'expired' };
  let response: Response;
  try {
    response = await fetch(`${API_URL}/patient/auth/refresh`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', accept: 'application/json' },
      body: JSON.stringify({ refreshToken }),
    });
  } catch {
    return { kind: 'offline' };
  }
  if (response.status === 401 || response.status === 400) {
    await sessionStorage.clear();
    return { kind: 'expired' };
  }
  if (!response.ok) return { kind: 'offline' };
  const body = (await response.json()) as Envelope<Session>;
  await sessionStorage.setRefreshToken(body.data.refreshToken);
  return { kind: 'ok', session: body.data };
}

export function refreshSession() {
  pending ??= requestRefresh().finally(() => {
    pending = null;
  });
  return pending;
}

const isAuthCall = (args: string | FetchArgs) => {
  const url = typeof args === 'string' ? args : args.url;
  return url.startsWith('/patient/auth/');
};

const baseQueryWithReauth: BaseQueryFn<string | FetchArgs, unknown, FetchBaseQueryError> = async (
  args,
  queryApi,
  extraOptions,
) => {
  let result = await rawBaseQuery(args, queryApi, extraOptions);
  if (result.error?.status !== 401 || isAuthCall(args)) return result;
  const refreshed = await refreshSession();
  if (refreshed.kind === 'ok') {
    queryApi.dispatch(tokenRefreshed({ accessToken: refreshed.session.accessToken }));
    result = await rawBaseQuery(args, queryApi, extraOptions);
    return result;
  }
  if (refreshed.kind === 'expired') {
    await sessionStorage.clear();
    queryApi.dispatch(signedOut({ notice: SESSION_ENDED }));
    queryApi.dispatch(baseApi.util.resetApiState());
  }
  return result;
};

export const baseApi = createApi({
  reducerPath: 'api',
  baseQuery: baseQueryWithReauth,
  tagTypes: TAG_TYPES,
  refetchOnReconnect: true,
  endpoints: () => ({}),
});

export const unwrapData = <T>(response: Envelope<T>) => response.data;
