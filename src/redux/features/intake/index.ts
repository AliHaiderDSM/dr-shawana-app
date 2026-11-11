import { baseApi, unwrapData } from '../../api/baseApi';
import type { IntakeForm, MedicineVisit, SaveIntakeInput } from './types';

export const intakeApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    getIntake: build.query<IntakeForm, void>({
      query: () => '/patient/intake',
      transformResponse: unwrapData<IntakeForm>,
      providesTags: ['Intake'],
    }),
    saveIntake: build.mutation<IntakeForm, SaveIntakeInput>({
      query: ({ key, data }) => ({ url: `/patient/intake/${key}`, method: 'PUT', body: data }),
      transformResponse: unwrapData<IntakeForm>,
      invalidatesTags: (_result, error) => (error ? [] : ['Intake', 'Patient', 'Overview']),
    }),
    getMedicines: build.query<MedicineVisit[], void>({
      query: () => '/patient/medicines',
      transformResponse: unwrapData<MedicineVisit[]>,
      providesTags: ['Medicines'],
    }),
  }),
});

export const { useGetIntakeQuery, useSaveIntakeMutation, useGetMedicinesQuery } = intakeApi;
export type { IntakeAppointment, IntakeForm, MedicineItem, MedicineVisit, SaveIntakeInput } from './types';
