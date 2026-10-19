import { router } from 'expo-router';
import { Alert } from 'react-native';
import { errorMessage } from '@/lib/errors';
import type { DoctorPatient } from '@/redux/features/doctor';

export function openChatWith(
  patient: Pick<DoctorPatient, 'id' | 'name' | 'conversationId'>,
  open: (patientId: string) => Promise<{ conversationId: string }>,
) {
  const go = (conversationId: string) =>
    router.push({
      pathname: '/doctor/chat/[conversationId]',
      params: { conversationId, patientId: patient.id, name: patient.name },
    });
  if (patient.conversationId) {
    go(patient.conversationId);
    return Promise.resolve();
  }
  return open(patient.id)
    .then(({ conversationId }) => go(conversationId))
    .catch((error: unknown) => Alert.alert('Could not open the chat', errorMessage(error)));
}
