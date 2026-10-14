import { baseApi, unwrapData } from '../../api/baseApi';
import { LIST } from '../../api/tagTypes';
import type { HistoryVisit } from './types';

export const medicalHistoryApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    getMedicalHistory: build.query<HistoryVisit[], void>({
      query: () => '/patient/history',
      transformResponse: unwrapData<HistoryVisit[]>,
      providesTags: [{ type: 'MedicalHistory', id: LIST }],
    }),
  }),
});

export const { useGetMedicalHistoryQuery } = medicalHistoryApi;
export type { HistoryVisit } from './types';
