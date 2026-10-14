import { baseApi, unwrapData } from '../../api/baseApi';
import type { LoginInput, Session } from './types';

export const authApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    login: build.mutation<Session, LoginInput>({
      query: (body) => ({ url: '/patient/auth/login', method: 'POST', body }),
      transformResponse: unwrapData<Session>,
    }),
    logout: build.mutation<void, void>({
      query: () => ({ url: '/patient/auth/logout', method: 'POST' }),
    }),
  }),
});
