import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Provider } from 'react-redux';
import { restoreSession } from '@/features/auth/auth-actions';
import { store, useAppDispatch, useAppSelector } from '@/store';
import { colors } from '@/theme/tokens';

function Navigator() {
  const dispatch = useAppDispatch();
  const status = useAppSelector((s) => s.auth.status);

  useEffect(() => {
    void dispatch(restoreSession());
  }, [dispatch]);

  return (
    <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.background } }}>
      <Stack.Screen name="index" />
      <Stack.Protected guard={status === 'signedIn'}>
        <Stack.Screen name="(patient)" />
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
