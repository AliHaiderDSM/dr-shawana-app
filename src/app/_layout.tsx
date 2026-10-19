import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Provider } from 'react-redux';
import { useAppDispatch, useAppSelector } from '@/redux/hooks';
import { store } from '@/redux/store';
import { colors } from '@/theme/tokens';
import { restoreSession } from '@/redux/features/auth';

function Navigator() {
  const dispatch = useAppDispatch();
  const status = useAppSelector((s) => s.auth.status);
  const role = useAppSelector((s) => s.auth.role);

  useEffect(() => {
    void dispatch(restoreSession());
  }, [dispatch]);

  return (
    <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.background } }}>
      <Stack.Screen name="index" />
      <Stack.Protected guard={status === 'signedIn' && role === 'patient'}>
        <Stack.Screen name="(patient)" />
      </Stack.Protected>
      <Stack.Protected guard={status === 'signedIn' && role === 'doctor'}>
        <Stack.Screen name="doctor" />
      </Stack.Protected>
      <Stack.Protected guard={status === 'signedOut'}>
        <Stack.Screen name="(auth)" />
      </Stack.Protected>
    </Stack>
  );
}

export default function RootLayout() {
  return (
    <Provider store={store}>
      <SafeAreaProvider>
        <StatusBar style="dark" />
        <Navigator />
      </SafeAreaProvider>
    </Provider>
  );
}
