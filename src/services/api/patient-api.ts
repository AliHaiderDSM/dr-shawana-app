import type {
  Appointment,
  ChatDoctor,
  ChatMessage,
  ChatPage,
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
    chatDoctors: build.query<ChatDoctor[], void>({
      query: () => '/patient/chats',
      transformResponse: unwrapData<ChatDoctor[]>,
      providesTags: [{ type: 'Chats', id: 'LIST' }],
    }),
    chatUnread: build.query<{ unread: number }, void>({
      query: () => '/patient/chats/unread',
      transformResponse: unwrapData<{ unread: number }>,
      providesTags: [{ type: 'Chats', id: 'UNREAD' }],
    }),
    chatMessages: build.query<ChatPage, { doctorId: string; before?: string }>({
      query: ({ doctorId, before }) => ({
        url: `/patient/chats/${encodeURIComponent(doctorId)}/messages`,
        params: before ? { before } : undefined,
      }),
      transformResponse: unwrapData<ChatPage>,
      providesTags: (_r, _e, { doctorId }) => [{ type: 'Chats', id: doctorId }],
    }),
    sendChatMessage: build.mutation<ChatMessage, { doctorId: string; body: string }>({
      query: ({ doctorId, body }) => ({
        url: `/patient/chats/${encodeURIComponent(doctorId)}/messages`,
        method: 'POST',
        body: { body },
      }),
      transformResponse: unwrapData<ChatMessage>,
      invalidatesTags: (_r, _e, { doctorId }) => [
        { type: 'Chats', id: 'LIST' },
        { type: 'Chats', id: doctorId },
      ],
    }),
    chatFileUrl: build.mutation<SignedUrl, { doctorId: string; messageId: string }>({
      query: ({ doctorId, messageId }) => ({
        url: `/patient/chats/${encodeURIComponent(doctorId)}/messages/${encodeURIComponent(messageId)}/file`,
        method: 'GET',
      }),
      transformResponse: unwrapData<SignedUrl>,
    }),
    savePushToken: build.mutation<void, { token: string; platform: string }>({
      query: (body) => ({ url: '/patient/push-token', method: 'POST', body }),
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
  useChatDoctorsQuery,
  useChatUnreadQuery,
  useChatMessagesQuery,
  useLazyChatMessagesQuery,
  useSendChatMessageMutation,
  useChatFileUrlMutation,
  useSavePushTokenMutation,
} = patientApi;
