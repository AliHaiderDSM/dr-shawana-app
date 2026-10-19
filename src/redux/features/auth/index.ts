import { authApi } from './api';

export { authApi };
export { noticeSeen } from './authSlice';
export { completeSignIn, restoreSession, signOut } from './session';
export type { AppSession, LoginInput, PasswordLoginInput, ResetPasswordInput, Session } from './types';
export type { AppRole } from './storage';

export const {
  useLoginMutation,
  useLogoutMutation,
  usePasswordLoginMutation,
  useResetPasswordMutation,
  useAppLoginMutation,
} = authApi;
