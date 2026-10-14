import { baseApi, unwrapData } from '../../api/baseApi';
import { LIST } from '../../api/tagTypes';
import type { PrescriptionDetail, PrescriptionSummary } from './types';

export const prescriptionsApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    getPrescriptions: build.query<PrescriptionSummary[], void>({
      query: () => '/patient/prescriptions',
      transformResponse: unwrapData<PrescriptionSummary[]>,
      providesTags: (result) => [
        { type: 'Prescription', id: LIST },
        ...(result ?? []).map((p) => ({ type: 'Prescription' as const, id: p.id })),
      ],
    }),
    getPrescription: build.query<PrescriptionDetail, string>({
      query: (id) => `/patient/prescriptions/${encodeURIComponent(id)}`,
      transformResponse: unwrapData<PrescriptionDetail>,
      providesTags: (_result, _error, id) => [{ type: 'Prescription', id }],
    }),
  }),
});

export const { useGetPrescriptionsQuery, useGetPrescriptionQuery } = prescriptionsApi;
export type { PrescriptionDetail, PrescriptionItem, PrescriptionSummary } from './types';
