import type { SignedUrl } from '@/types/api';
import { baseApi, unwrapData } from '../../api/baseApi';
import { fileUpload } from '../../api/formData';
import { LIST } from '../../api/tagTypes';
import type { ChatPage, ChatMessage, ChatRealtime, PushTokenInput } from '../chat/types';
import type {
  AppointmentsWhen,
  DoctorAppointmentsPage,
  DoctorHome,
  DoctorPatient,
  DoctorProfile,
  PatientFile,
  SendDoctorMessageInput,
  UpdateDoctorProfileInput,
} from './types';

const threadPath = (conversationId: string) => `/branch/chats/${encodeURIComponent(conversationId)}`;

export const doctorApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    getDoctorHome: build.query<DoctorHome, void>({
      query: () => '/doctor/home',
      transformResponse: unwrapData<DoctorHome>,
      providesTags: [{ type: 'DoctorHome', id: LIST }],
    }),
    getDoctorPatients: build.query<DoctorPatient[], string>({
      query: (search) => ({ url: '/doctor/patients', params: search ? { search } : undefined }),
      transformResponse: unwrapData<DoctorPatient[]>,
      providesTags: [{ type: 'DoctorPatient', id: LIST }],
    }),
    getDoctorAppointments: build.query<DoctorAppointmentsPage, { when: AppointmentsWhen; page: number }>({
      query: ({ when, page }) => ({ url: '/doctor/appointments', params: { when, page } }),
      transformResponse: unwrapData<DoctorAppointmentsPage>,
      serializeQueryArgs: ({ queryArgs }) => queryArgs.when,
      merge: (cached, incoming) =>
        incoming.page === 1
          ? incoming
          : {
              ...incoming,
              items: [
                ...cached.items,
                ...incoming.items.filter((a) => !cached.items.some((c) => c.id === a.id)),
              ],
            },
      forceRefetch: ({ currentArg, previousArg }) => currentArg?.page !== previousArg?.page,
      providesTags: [{ type: 'DoctorHome', id: LIST }],
    }),
    getDoctorProfile: build.query<DoctorProfile, void>({
      query: () => '/doctor/profile',
      transformResponse: unwrapData<DoctorProfile>,
      providesTags: [{ type: 'DoctorProfile', id: LIST }],
    }),
    updateDoctorProfile: build.mutation<DoctorProfile, UpdateDoctorProfileInput>({
      query: (body) => ({ url: '/doctor/profile', method: 'PUT', body }),
      transformResponse: unwrapData<DoctorProfile>,
      invalidatesTags: (_r, error) =>
        error
          ? []
          : [
              { type: 'DoctorProfile', id: LIST },
              { type: 'DoctorHome', id: LIST },
            ],
    }),
    changeDoctorPassword: build.mutation<void, { currentPassword: string; newPassword: string }>({
      query: (body) => ({ url: '/auth/change-password', method: 'POST', body }),
    }),
    getDoctorPatientFile: build.query<PatientFile, string>({
      query: (patientId) => `/doctor/patients/${encodeURIComponent(patientId)}`,
      transformResponse: unwrapData<PatientFile>,
      providesTags: (_r, _e, patientId) => [{ type: 'DoctorPatient', id: patientId }],
    }),
    openDoctorChat: build.mutation<{ conversationId: string }, string>({
      query: (patientId) => ({
        url: `/doctor/patients/${encodeURIComponent(patientId)}/chat`,
        method: 'POST',
      }),
      transformResponse: unwrapData<{ conversationId: string }>,
    }),
    getDoctorRecordUrl: build.query<SignedUrl, { patientId: string; fileId: string }>({
      query: ({ patientId, fileId }) =>
        `/doctor/patients/${encodeURIComponent(patientId)}/files/${encodeURIComponent(fileId)}/url`,
      transformResponse: unwrapData<SignedUrl>,
      keepUnusedDataFor: 0,
    }),
    saveDoctorRemarks: build.mutation<
      void,
      { consultationId: string; patientId: string; remarks: string | null }
    >({
      query: ({ consultationId, remarks }) => ({
        url: `/doctor/consultations/${encodeURIComponent(consultationId)}/remarks`,
        method: 'PUT',
        body: { remarks },
      }),
      invalidatesTags: (_r, error, { patientId }) =>
        error ? [] : [{ type: 'DoctorPatient', id: patientId }],
    }),
    saveDoctorPushToken: build.mutation<void, PushTokenInput>({
      query: (body) => ({ url: '/doctor/push-token', method: 'POST', body }),
    }),
    getDoctorThread: build.query<ChatPage, { conversationId: string; before?: string }>({
      query: ({ conversationId, before }) => ({
        url: `${threadPath(conversationId)}/messages`,
        params: before ? { before } : undefined,
      }),
      transformResponse: unwrapData<ChatPage>,
      providesTags: (_r, _e, { conversationId }) => [{ type: 'DoctorThread', id: conversationId }],
    }),
    sendDoctorMessage: build.mutation<ChatMessage, SendDoctorMessageInput>({
      query: ({ conversationId, body, file, replyToId, durationMs }) => {
        const extra = {
          ...(body ? { body } : {}),
          ...(replyToId ? { replyToId } : {}),
          ...(durationMs ? { durationMs: String(Math.round(durationMs)) } : {}),
        };
        return file
          ? fileUpload(`${threadPath(conversationId)}/messages`, 'file', file, extra)
          : {
              url: `${threadPath(conversationId)}/messages`,
              method: 'POST',
              body: { body, ...(replyToId ? { replyToId } : {}) },
            };
      },
      transformResponse: unwrapData<ChatMessage>,
      invalidatesTags: (_r, error, { conversationId }) =>
        error
          ? []
          : [
              { type: 'DoctorThread', id: conversationId },
              { type: 'DoctorHome', id: LIST },
              { type: 'DoctorPatient', id: LIST },
            ],
    }),
    getDoctorChatFileUrl: build.query<SignedUrl, { conversationId: string; messageId: string }>({
      query: ({ conversationId, messageId }) =>
        `${threadPath(conversationId)}/messages/${encodeURIComponent(messageId)}/file`,
      transformResponse: unwrapData<SignedUrl>,
      keepUnusedDataFor: 0,
    }),
    getDoctorRealtime: build.query<ChatRealtime | null, void>({
      query: () => '/branch/chats/realtime',
      transformResponse: unwrapData<ChatRealtime | null>,
      keepUnusedDataFor: 3600,
    }),
  }),
});

export const {
  useGetDoctorHomeQuery,
  useGetDoctorPatientsQuery,
  useGetDoctorPatientFileQuery,
  useOpenDoctorChatMutation,
  useLazyGetDoctorRecordUrlQuery,
  useSaveDoctorRemarksMutation,
  useGetDoctorProfileQuery,
  useGetDoctorAppointmentsQuery,
  useUpdateDoctorProfileMutation,
  useChangeDoctorPasswordMutation,
  useSaveDoctorPushTokenMutation,
  useGetDoctorThreadQuery,
  useLazyGetDoctorThreadQuery,
  useSendDoctorMessageMutation,
  useLazyGetDoctorChatFileUrlQuery,
  useGetDoctorRealtimeQuery,
} = doctorApi;

export const doctorChatArrived = (conversationId?: string) =>
  baseApi.util.invalidateTags([
    { type: 'DoctorHome', id: LIST },
    { type: 'DoctorPatient', id: LIST },
    ...(conversationId
      ? [{ type: 'DoctorThread' as const, id: conversationId }]
      : [{ type: 'DoctorThread' as const }]),
  ]);

export type * from './types';
