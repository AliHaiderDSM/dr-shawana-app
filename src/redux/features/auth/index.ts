import { authApi } from './api';

export { authApi };
export { noticeSeen } from './authSlice';
export { completeSignIn, restoreSession, signOut } from './session';
export type { LoginInput, PasswordLoginInput, ResetPasswordInput, Session } from './types';

export const { useLoginMutation, useLogoutMutation, usePasswordLoginMutation, useResetPasswordMutation } =
  authApi;
