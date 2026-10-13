import { Stack } from 'expo-router';
import { colors } from '@/theme/tokens';

export default function PatientLayout() {
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
      <Stack.Screen name="documents" options={{ title: 'Documents' }} />
      <Stack.Screen name="requests/index" options={{ title: 'My requests' }} />
      <Stack.Screen name="requests/[id]" options={{ title: 'Request' }} />
      <Stack.Screen name="settings" options={{ title: 'Change password' }} />
    </Stack>
  );
}
