import { baseApi, unwrapData } from '../../api/baseApi';
import type { Overview, PatientProfile, SetPasswordInput, UpdateProfileInput } from './types';

export const patientApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    getMe: build.query<PatientProfile, void>({
      query: () => '/patient/me',
      transformResponse: unwrapData<PatientProfile>,
      providesTags: [{ type: 'Patient', id: 'ME' }],
    }),
    updateMe: build.mutation<PatientProfile, UpdateProfileInput>({
      query: (body) => ({ url: '/patient/me', method: 'PATCH', body }),
      transformResponse: unwrapData<PatientProfile>,
      invalidatesTags: (_result, error) => (error ? [] : [{ type: 'Patient', id: 'ME' }, 'Overview']),
    }),
    setPassword: build.mutation<void, SetPasswordInput>({
      query: (body) => ({ url: '/patient/me/password', method: 'POST', body }),
      invalidatesTags: (_result, error) => (error ? [] : [{ type: 'Patient', id: 'ME' }]),
    }),
    getOverview: build.query<Overview, void>({
      query: () => '/patient/overview',
      transformResponse: unwrapData<Overview>,
      providesTags: ['Overview'],
    }),
  }),
});

export const { useGetMeQuery, useUpdateMeMutation, useGetOverviewQuery, useSetPasswordMutation } = patientApi;
export type {
  Clinic,
  EducationalResources,
  Overview,
  PatientProfile,
  ResourceFile,
  UpdateProfileInput,
} from './types';
