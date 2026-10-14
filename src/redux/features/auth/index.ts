import { authApi } from './api';

export { authApi };
export { noticeSeen } from './authSlice';
export { completeSignIn, restoreSession, signOut } from './session';
export type { LoginInput, Session } from './types';

export const { useLoginMutation, useLogoutMutation } = authApi;
