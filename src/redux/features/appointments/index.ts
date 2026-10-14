import { baseApi, unwrapData } from '../../api/baseApi';
import { LIST } from '../../api/tagTypes';
import type { Appointment, AppointmentDetail } from './types';

export const appointmentsApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    getAppointments: build.query<Appointment[], void>({
      query: () => '/patient/appointments',
      transformResponse: unwrapData<Appointment[]>,
      providesTags: (result) => [
        { type: 'Appointment', id: LIST },
        ...(result ?? []).map((a) => ({ type: 'Appointment' as const, id: a.id })),
      ],
    }),
    getAppointment: build.query<AppointmentDetail, string>({
      query: (id) => `/patient/appointments/${encodeURIComponent(id)}`,
      transformResponse: unwrapData<AppointmentDetail>,
      providesTags: (_result, _error, id) => [{ type: 'Appointment', id }],
    }),
  }),
});

export const { useGetAppointmentsQuery, useGetAppointmentQuery } = appointmentsApi;
export type { Appointment, AppointmentDetail, AppointmentStatus, Branch } from './types';
