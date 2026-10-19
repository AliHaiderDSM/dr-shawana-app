import { baseApi, refreshSession } from '../../api/baseApi';
import type { AppDispatch, RootState } from '../../store';
import { lastPushToken } from '@/lib/push-notifications';
import { authApi } from './api';
import { restoring, signedIn, signedOut, unreachable } from './authSlice';
import { sessionStorage, type AppRole } from './storage';
import type { Session } from './types';

export function restoreSession() {
  return async (dispatch: AppDispatch) => {
    dispatch(restoring());
    const result = await refreshSession();
    if (result.kind === 'ok')
      dispatch(signedIn({ accessToken: result.session.accessToken, role: result.role }));
    else if (result.kind === 'offline') dispatch(unreachable());
    else dispatch(signedOut());
  };
}

export function completeSignIn(
  session: Pick<Session, 'accessToken' | 'refreshToken'>,
  role: AppRole = 'patient',
) {
  return async (dispatch: AppDispatch) => {
    dispatch(baseApi.util.resetApiState());
    await sessionStorage.setSession(session.refreshToken, role);
    dispatch(signedIn({ accessToken: session.accessToken, role }));
  };
}

export function signOut(notice?: string) {
  return async (dispatch: AppDispatch, getState: () => RootState) => {
    const doctor = getState().auth.role === 'doctor';
    const token = lastPushToken();
    const request = doctor
      ? token
        ? dispatch(authApi.endpoints.forgetDoctorPushToken.initiate(token))
        : Promise.resolve()
      : dispatch(authApi.endpoints.logout.initiate());
    await Promise.race([request, new Promise((resolve) => setTimeout(resolve, 4_000))]).catch(
      () => undefined,
    );
    await sessionStorage.clear();
    dispatch(signedOut(notice ? { notice } : undefined));
    dispatch(baseApi.util.resetApiState());
  };
}
