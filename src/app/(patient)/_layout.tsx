import { Stack } from 'expo-router';
import { useChatRealtime } from '@/hooks/use-chat-realtime';
import { usePasswordPrompt } from '@/hooks/use-password-prompt';
import { usePushRegistration } from '@/hooks/use-push-registration';
import { colors } from '@/theme/tokens';

export default function PatientLayout() {
  usePushRegistration();
  useChatRealtime();
  usePasswordPrompt();
  return (
    <Stack
      screenOptions={{
        headerShadowVisible: false,
        headerStyle: { backgroundColor: colors.background },
        headerTintColor: colors.primary,
        headerTitleStyle: { color: colors.text },
        contentStyle: { backgroundColor: colors.background },
        headerBackButtonDisplayMode: 'minimal',
      }}
    >
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="appointments/index" options={{ title: 'Appointments' }} />
      <Stack.Screen name="appointments/[id]" options={{ title: 'Appointment' }} />
      <Stack.Screen name="prescriptions/[id]" options={{ title: 'Prescription' }} />
      <Stack.Screen name="documents" options={{ title: 'Medical records' }} />
      <Stack.Screen name="resources" options={{ title: 'Educational resources' }} />
      <Stack.Screen name="requests/index" options={{ title: 'My requests' }} />
      <Stack.Screen name="requests/[id]" options={{ title: 'Request' }} />
      <Stack.Screen name="contact" options={{ title: 'Contact the clinic' }} />
      <Stack.Screen name="chats/info/[doctorId]" options={{ title: 'Doctor info' }} />
      <Stack.Screen name="profile-edit" options={{ title: 'Edit my details' }} />
      <Stack.Screen name="password" options={{ title: 'App password' }} />
      <Stack.Screen name="chats/[doctorId]" options={{ title: 'Your doctor' }} />
    </Stack>
  );
}
