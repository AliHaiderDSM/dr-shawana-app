import { baseApi, unwrapData } from '../../api/baseApi';
import type { LoginInput, PasswordLoginInput, ResetPasswordInput, Session } from './types';

export const authApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    login: build.mutation<Session, LoginInput>({
      query: (body) => ({ url: '/patient/auth/login', method: 'POST', body }),
      transformResponse: unwrapData<Session>,
    }),
    passwordLogin: build.mutation<Session, PasswordLoginInput>({
      query: (body) => ({ url: '/patient/auth/password-login', method: 'POST', body }),
      transformResponse: unwrapData<Session>,
    }),
    resetPassword: build.mutation<Session, ResetPasswordInput>({
      query: (body) => ({ url: '/patient/auth/reset-password', method: 'POST', body }),
      transformResponse: unwrapData<Session>,
    }),
    logout: build.mutation<void, void>({
      query: () => ({ url: '/patient/auth/logout', method: 'POST' }),
    }),
  }),
});
