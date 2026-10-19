import type { SignedUrl } from '@/types/api';
import { baseApi, unwrapData } from '../../api/baseApi';
import { fileUpload } from '../../api/formData';
import { LIST } from '../../api/tagTypes';
import type { ChatPage, ChatMessage, ChatRealtime, PushTokenInput } from '../chat/types';
import type { DoctorHome, DoctorPatient, PatientFile, SendDoctorMessageInput } from './types';

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
