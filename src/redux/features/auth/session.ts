import { baseApi, refreshSession } from '../../api/baseApi';
import type { AppDispatch } from '../../store';
import { authApi } from './api';
import { restoring, signedIn, signedOut, unreachable } from './authSlice';
import { sessionStorage } from './storage';
import type { Session } from './types';

export function restoreSession() {
  return async (dispatch: AppDispatch) => {
    dispatch(restoring());
    const result = await refreshSession();
    if (result.kind === 'ok') dispatch(signedIn({ accessToken: result.session.accessToken }));
    else if (result.kind === 'offline') dispatch(unreachable());
    else dispatch(signedOut());
  };
}

export function completeSignIn(session: Session) {
  return async (dispatch: AppDispatch) => {
    dispatch(baseApi.util.resetApiState());
    await sessionStorage.setRefreshToken(session.refreshToken);
    dispatch(signedIn({ accessToken: session.accessToken }));
  };
}

export function signOut(notice?: string) {
  return async (dispatch: AppDispatch) => {
    const request = dispatch(authApi.endpoints.logout.initiate());
    await Promise.race([request, new Promise((resolve) => setTimeout(resolve, 4_000))]).catch(
      () => undefined,
    );
    await sessionStorage.clear();
    dispatch(signedOut(notice ? { notice } : undefined));
    dispatch(baseApi.util.resetApiState());
  };
}
