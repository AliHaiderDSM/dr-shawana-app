import { baseApi, unwrapData } from '../../api/baseApi';
import { LIST } from '../../api/tagTypes';
import type { ManagementRequest, NewRequestInput } from './types';

export const managementRequestsApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    getRequests: build.query<ManagementRequest[], void>({
      query: () => '/patient/requests',
      transformResponse: unwrapData<ManagementRequest[]>,
      providesTags: [{ type: 'ManagementRequest', id: LIST }],
    }),
    getRequest: build.query<ManagementRequest, string>({
      query: (id) => `/patient/requests/${encodeURIComponent(id)}`,
      transformResponse: unwrapData<ManagementRequest>,
      providesTags: (_result, _error, id) => [{ type: 'ManagementRequest', id }],
    }),
    createRequest: build.mutation<ManagementRequest, NewRequestInput>({
      query: (body) => ({ url: '/patient/requests', method: 'POST', body }),
      transformResponse: unwrapData<ManagementRequest>,
      invalidatesTags: (_result, error) =>
        error ? [] : [{ type: 'ManagementRequest', id: LIST }, 'Overview'],
    }),
  }),
});

export const { useGetRequestsQuery, useGetRequestQuery, useCreateRequestMutation } = managementRequestsApi;
export { REQUEST_CATEGORIES } from './types';
export type { ManagementRequest, NewRequestInput, RequestCategory, RequestStatus } from './types';
