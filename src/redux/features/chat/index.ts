import type { SignedUrl } from '@/types/api';
import { baseApi, unwrapData } from '../../api/baseApi';
import { fileUpload } from '../../api/formData';
import { LIST, UNREAD } from '../../api/tagTypes';
import type {
  ChatDoctor,
  ChatMessage,
  ChatPage,
  ChatRealtime,
  PushTokenInput,
  SendChatMessageInput,
} from './types';

const chatPath = (doctorId: string) => `/patient/chats/${encodeURIComponent(doctorId)}`;

export const chatApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    getChatDoctors: build.query<ChatDoctor[], void>({
      query: () => '/patient/chats',
      transformResponse: unwrapData<ChatDoctor[]>,
      providesTags: [{ type: 'Conversation', id: LIST }],
    }),
    getChatUnread: build.query<{ unread: number }, void>({
      query: () => '/patient/chats/unread',
      transformResponse: unwrapData<{ unread: number }>,
      providesTags: [{ type: 'Conversation', id: UNREAD }],
    }),
    getChatMessages: build.query<ChatPage, { doctorId: string; before?: string }>({
      query: ({ doctorId, before }) => ({
        url: `${chatPath(doctorId)}/messages`,
        params: before ? { before } : undefined,
      }),
      transformResponse: unwrapData<ChatPage>,
      providesTags: (_result, _error, { doctorId }) => [{ type: 'Message', id: doctorId }],
    }),
    getChatFiles: build.query<ChatMessage[], string>({
      query: (doctorId) => `${chatPath(doctorId)}/files`,
      transformResponse: unwrapData<ChatMessage[]>,
      providesTags: (_result, _error, doctorId) => [{ type: 'Message', id: `files-${doctorId}` }],
    }),
    getChatFileUrl: build.query<SignedUrl, { doctorId: string; messageId: string }>({
      query: ({ doctorId, messageId }) =>
        `${chatPath(doctorId)}/messages/${encodeURIComponent(messageId)}/file`,
      transformResponse: unwrapData<SignedUrl>,
      keepUnusedDataFor: 0,
    }),
    sendChatMessage: build.mutation<ChatMessage, SendChatMessageInput>({
      query: ({ doctorId, body, file, replyToId, durationMs }) => {
        const extra = {
          ...(body ? { body } : {}),
          ...(replyToId ? { replyToId } : {}),
          ...(durationMs ? { durationMs: String(Math.round(durationMs)) } : {}),
        };
        return file
          ? fileUpload(`${chatPath(doctorId)}/messages`, 'file', file, extra)
          : {
              url: `${chatPath(doctorId)}/messages`,
              method: 'POST',
              body: { body, ...(replyToId ? { replyToId } : {}) },
            };
      },
      transformResponse: unwrapData<ChatMessage>,
      invalidatesTags: (_result, error, { doctorId, file }) =>
        error
          ? []
          : [
              { type: 'Message', id: doctorId },
              { type: 'Conversation', id: LIST },
              ...(file ? [{ type: 'Message' as const, id: `files-${doctorId}` }] : []),
            ],
    }),
    getChatRealtime: build.query<ChatRealtime | null, void>({
      query: () => '/patient/chats/realtime',
      transformResponse: unwrapData<ChatRealtime | null>,
      keepUnusedDataFor: 3600,
    }),
    savePushToken: build.mutation<void, PushTokenInput>({
      query: (body) => ({ url: '/patient/push-token', method: 'POST', body }),
    }),
  }),
});

const openChats = new Map<string, number>();

export function chatOpened(doctorId: string) {
  openChats.set(doctorId, (openChats.get(doctorId) ?? 0) + 1);
  return () => {
    const left = (openChats.get(doctorId) ?? 1) - 1;
    if (left > 0) openChats.set(doctorId, left);
    else openChats.delete(doctorId);
  };
}

export const chatArrived = (doctorId?: string) =>
  doctorId && openChats.has(doctorId)
    ? baseApi.util.invalidateTags([{ type: 'Message', id: doctorId }])
    : baseApi.util.invalidateTags([
        { type: 'Conversation', id: LIST },
        { type: 'Conversation', id: UNREAD },
        ...(doctorId ? [{ type: 'Message' as const, id: doctorId }] : [{ type: 'Message' as const }]),
      ]);

export const markChatsSeen = () =>
  baseApi.util.invalidateTags([
    { type: 'Conversation', id: LIST },
    { type: 'Conversation', id: UNREAD },
  ]);

export const {
  useGetChatDoctorsQuery,
  useGetChatUnreadQuery,
  useGetChatMessagesQuery,
  useLazyGetChatMessagesQuery,
  useGetChatFilesQuery,
  useGetChatRealtimeQuery,
  useLazyGetChatFileUrlQuery,
  useSendChatMessageMutation,
  useSavePushTokenMutation,
} = chatApi;
export type { ChatDoctor, ChatMessage, ChatPage, SendChatMessageInput } from './types';
