import { router, useLocalSearchParams } from 'expo-router';
import { useEffect } from 'react';
import { ChatThread } from '@/components/chat/chat-thread';
import { baseApi } from '@/redux/api/baseApi';
import { LIST } from '@/redux/api/tagTypes';
import { useAppDispatch } from '@/redux/hooks';
import {
  useGetDoctorPatientsQuery,
  useGetDoctorThreadQuery,
  useLazyGetDoctorChatFileUrlQuery,
  useLazyGetDoctorThreadQuery,
  useSendDoctorMessageMutation,
} from '@/redux/features/doctor';

export default function DoctorChatScreen() {
  const {
    conversationId = '',
    patientId = '',
    name,
  } = useLocalSearchParams<{ conversationId: string; patientId?: string; name?: string }>();
  const dispatch = useAppDispatch();
  const patient = useGetDoctorPatientsQuery('', {
    selectFromResult: ({ data }) => ({ data: data?.find((p) => p.conversationId === conversationId) }),
  }).data;
  const title = patient?.name || name || 'Patient';
  const initial = title.trim().charAt(0).toUpperCase() || 'P';
  const id = patient?.id ?? patientId;
  const latest = useGetDoctorThreadQuery(
    { conversationId },
    { skip: !conversationId, refetchOnMountOrArgChange: true },
  );
  const [loadOlder, olderState] = useLazyGetDoctorThreadQuery();
  const [sendMessage, sendState] = useSendDoctorMessageMutation();
  const [getFileUrl] = useLazyGetDoctorChatFileUrlQuery();

  const seenAt = latest.data ? (latest.data.items.at(-1)?.id ?? 'empty') : null;
  useEffect(() => {
    if (!seenAt) return;
    dispatch(
      baseApi.util.invalidateTags([
        { type: 'DoctorHome', id: LIST },
        { type: 'DoctorPatient', id: LIST },
      ]),
    );
  }, [seenAt, dispatch]);

  return (
    <ChatThread
      me="doctor"
      otherLabel={title}
      title={title}
      initial={initial}
      subtitle={patient?.phone ? `${patient.phone} · Tap for patient file` : 'Tap for patient file'}
      headerLabel={`${title}, open the patient file`}
      onHeaderPress={() => {
        if (id)
          router.push({ pathname: '/doctor/patient/[patientId]', params: { patientId: id, from: 'chat' } });
      }}
      latest={latest}
      loadOlder={(before) => loadOlder({ conversationId, before }).unwrap()}
      loadingOlder={olderState.isFetching}
      send={(input) => sendMessage({ conversationId, ...input }).unwrap()}
      sending={sendState.isLoading}
      fileUrl={async (messageId) => (await getFileUrl({ conversationId, messageId }).unwrap()).url}
      hint="Only you and this patient see these messages."
      emptyText="Write the first message. The patient gets a notification."
    />
  );
}
