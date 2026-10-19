import { baseApi, unwrapData } from '../../api/baseApi';
import type { AppSession, LoginInput, PasswordLoginInput, ResetPasswordInput, Session } from './types';

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
    appLogin: build.mutation<AppSession, { identifier: string; password: string; device?: string | null }>({
      query: (body) => ({ url: '/app/login', method: 'POST', body }),
      transformResponse: unwrapData<AppSession>,
    }),
    forgetDoctorPushToken: build.mutation<void, string>({
      query: (token) => ({ url: '/doctor/push-token/remove', method: 'POST', body: { token } }),
    }),
    logout: build.mutation<void, void>({
      query: () => ({ url: '/patient/auth/logout', method: 'POST' }),
    }),
  }),
});
