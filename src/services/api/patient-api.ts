import type {
  Appointment,
  AppointmentDetail,
  HistoryVisit,
  ManagementRequest,
  MedicalDocument,
  Overview,
  PatientProfile,
  PrescriptionDetail,
  PrescriptionSummary,
  RequestCategory,
  Session,
  SignedUrl,
} from '@/types/api';
import { api, unwrapData } from './base-api';

export interface LoginInput {
  phone: string;
  code: string;
  device?: string | null;
}

export interface NewRequestInput {
  category: RequestCategory;
  subject: string;
  message: string;
}

export const patientApi = api.injectEndpoints({
  endpoints: (build) => ({
    login: build.mutation<Session, LoginInput>({
      query: (body) => ({ url: '/patient/auth/login', method: 'POST', body }),
      transformResponse: unwrapData<Session>,
    }),
    logout: build.mutation<void, void>({
      query: () => ({ url: '/patient/auth/logout', method: 'POST' }),
    }),
    me: build.query<PatientProfile, void>({
      query: () => '/patient/me',
      transformResponse: unwrapData<PatientProfile>,
      providesTags: ['Profile'],
    }),
    overview: build.query<Overview, void>({
      query: () => '/patient/overview',
      transformResponse: unwrapData<Overview>,
      providesTags: ['Overview'],
    }),
    appointments: build.query<Appointment[], void>({
      query: () => '/patient/appointments',
      transformResponse: unwrapData<Appointment[]>,
      providesTags: ['Appointments'],
    }),
    appointment: build.query<AppointmentDetail, string>({
      query: (id) => `/patient/appointments/${encodeURIComponent(id)}`,
      transformResponse: unwrapData<AppointmentDetail>,
      providesTags: (_r, _e, id) => [{ type: 'Appointments', id }],
    }),
    history: build.query<HistoryVisit[], void>({
      query: () => '/patient/history',
      transformResponse: unwrapData<HistoryVisit[]>,
      providesTags: ['History'],
    }),
    prescriptions: build.query<PrescriptionSummary[], void>({
      query: () => '/patient/prescriptions',
      transformResponse: unwrapData<PrescriptionSummary[]>,
      providesTags: ['Prescriptions'],
    }),
    prescription: build.query<PrescriptionDetail, string>({
      query: (id) => `/patient/prescriptions/${encodeURIComponent(id)}`,
      transformResponse: unwrapData<PrescriptionDetail>,
      providesTags: (_r, _e, id) => [{ type: 'Prescriptions', id }],
    }),
    documents: build.query<MedicalDocument[], void>({
      query: () => '/patient/documents',
      transformResponse: unwrapData<MedicalDocument[]>,
      providesTags: ['Documents'],
    }),
    documentUrl: build.mutation<SignedUrl, string>({
      query: (fileId) => ({
        url: `/patient/documents/files/${encodeURIComponent(fileId)}/url`,
        method: 'GET',
      }),
      transformResponse: unwrapData<SignedUrl>,
    }),
    requests: build.query<ManagementRequest[], void>({
      query: () => '/patient/requests',
      transformResponse: unwrapData<ManagementRequest[]>,
      providesTags: ['Requests'],
    }),
    request: build.query<ManagementRequest, string>({
      query: (id) => `/patient/requests/${encodeURIComponent(id)}`,
      transformResponse: unwrapData<ManagementRequest>,
      providesTags: (_r, _e, id) => [{ type: 'Requests', id }],
    }),
    createRequest: build.mutation<ManagementRequest, NewRequestInput>({
      query: (body) => ({ url: '/patient/requests', method: 'POST', body }),
      transformResponse: unwrapData<ManagementRequest>,
      invalidatesTags: ['Requests', 'Overview'],
    }),
  }),
});

export const {
  useLoginMutation,
  useLogoutMutation,
  useMeQuery,
  useOverviewQuery,
  useAppointmentsQuery,
  useAppointmentQuery,
  useHistoryQuery,
  usePrescriptionsQuery,
  usePrescriptionQuery,
  useDocumentsQuery,
  useDocumentUrlMutation,
  useRequestsQuery,
  useRequestQuery,
  useCreateRequestMutation,
} = patientApi;
