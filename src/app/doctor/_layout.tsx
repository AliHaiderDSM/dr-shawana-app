import { Stack } from 'expo-router';
import { useDoctorSession } from '@/hooks/use-doctor-session';
import { colors } from '@/theme/tokens';

export default function DoctorLayout() {
  useDoctorSession();
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
      <Stack.Screen name="chat/[conversationId]" options={{ title: 'Patient' }} />
      <Stack.Screen name="patient/[patientId]" options={{ title: 'Patient file' }} />
      <Stack.Screen name="remarks/[consultationId]" options={{ title: 'Clinical remarks' }} />
      <Stack.Screen name="appointments" options={{ title: 'Appointments' }} />
      <Stack.Screen name="profile-edit" options={{ title: 'Edit profile' }} />
      <Stack.Screen name="password" options={{ title: 'Change password' }} />
    </Stack>
  );
}
