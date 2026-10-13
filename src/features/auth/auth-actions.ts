import { api, refreshSession } from '@/services/api/base-api';
import { patientApi } from '@/services/api/patient-api';
import type { AppDispatch } from '@/store';
import type { Session } from '@/types/api';
import { restoring, signedIn, signedOut, unreachable } from './auth-slice';
import { sessionStorage } from './session-storage';

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
    dispatch(api.util.resetApiState());
    await sessionStorage.setRefreshToken(session.refreshToken);
    dispatch(signedIn({ accessToken: session.accessToken }));
  };
}

export function signOut(notice?: string) {
  return async (dispatch: AppDispatch) => {
    const request = dispatch(patientApi.endpoints.logout.initiate());
    await Promise.race([request, new Promise((resolve) => setTimeout(resolve, 4_000))]).catch(
      () => undefined,
    );
    await sessionStorage.clear();
    dispatch(signedOut(notice ? { notice } : undefined));
    dispatch(api.util.resetApiState());
  };
}
