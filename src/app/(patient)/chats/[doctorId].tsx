import { router, useLocalSearchParams } from 'expo-router';
import { useEffect } from 'react';
import { ChatThread } from '@/components/chat/chat-thread';
import { useAppDispatch } from '@/redux/hooks';
import {
  chatOpened,
  markChatsSeen,
  useGetChatDoctorsQuery,
  useGetChatMessagesQuery,
  useLazyGetChatFileUrlQuery,
  useLazyGetChatMessagesQuery,
  useSendChatMessageMutation,
} from '@/redux/features/chat';

export default function ChatScreen() {
  const { doctorId = '', name } = useLocalSearchParams<{ doctorId: string; name?: string }>();
  const dispatch = useAppDispatch();
  const doctor = useGetChatDoctorsQuery(undefined, {
    selectFromResult: ({ data }) => ({ data: data?.find((d) => d.doctorId === doctorId) }),
  }).data;
  const title = doctor?.name || name || 'Your doctor';
  const initial =
    title
      .replace(/^dr\.?\s*/i, '')
      .charAt(0)
      .toUpperCase() || 'D';
  const latest = useGetChatMessagesQuery({ doctorId }, { skip: !doctorId, refetchOnMountOrArgChange: true });
  const [loadOlder, olderState] = useLazyGetChatMessagesQuery();
  const [sendMessage, sendState] = useSendChatMessageMutation();
  const [getFileUrl] = useLazyGetChatFileUrlQuery();

  const seenAt = latest.data ? (latest.data.items.at(-1)?.id ?? 'empty') : null;
  useEffect(() => {
    if (seenAt) {
      dispatch(markChatsSeen());
    }
  }, [seenAt, dispatch]);

  useEffect(() => (doctorId ? chatOpened(doctorId) : undefined), [doctorId]);

  return (
    <ChatThread
      me="patient"
      otherLabel="Doctor"
      title={title}
      initial={initial}
      subtitle={`${doctor?.details ? `${doctor.details} · ` : ''}Tap for details`}
      headerLabel={`${title}, open doctor details and shared files`}
      onHeaderPress={() =>
        router.push({ pathname: '/chats/info/[doctorId]', params: { doctorId, name: title } })
      }
      latest={latest}
      loadOlder={(before) => loadOlder({ doctorId, before }).unwrap()}
      loadingOlder={olderState.isFetching}
      send={(input) => sendMessage({ doctorId, ...input }).unwrap()}
      sending={sendState.isLoading}
      fileUrl={async (messageId) => (await getFileUrl({ doctorId, messageId }).unwrap()).url}
      hint="Messages go to your doctor only. Not for emergencies."
      emptyText="Write your first message. Your doctor replies here."
    />
  );
}
