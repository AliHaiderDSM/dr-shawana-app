import { Redirect } from 'expo-router';
import { HeartPulse, WifiOff } from 'lucide-react-native';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { AppText } from '@/components/ui/app-text';
import { Button } from '@/components/ui/button';
import { Screen } from '@/components/ui/screen';
import { restoreSession, signOut } from '@/features/auth/auth-actions';
import { useAppDispatch, useAppSelector } from '@/store';
import { colors, radius, space } from '@/theme/tokens';

export default function Index() {
  const dispatch = useAppDispatch();
  const status = useAppSelector((s) => s.auth.status);

  if (status === 'signedIn') return <Redirect href="/home" />;
  if (status === 'signedOut') return <Redirect href="/login" />;

  return (
    <Screen scroll={false} edges={['top', 'bottom', 'left', 'right']}>
      <View style={styles.center}>
        <View style={styles.logo}>
          {status === 'unreachable' ? (
            <WifiOff size={36} color={colors.danger} />
          ) : (
            <HeartPulse size={36} color={colors.primary} />
          )}
        </View>
        {status === 'unreachable' ? (
          <>
            <AppText variant="heading" center>
              Can&apos;t reach the clinic
            </AppText>
            <AppText tone="muted" center>
              Check your internet connection. You stay signed in.
            </AppText>
            <Button label="Try again" onPress={() => void dispatch(restoreSession())} fullWidth={false} />
            <Button
              label="Log out"
              variant="ghost"
              onPress={() => void dispatch(signOut())}
              fullWidth={false}
            />
          </>
        ) : (
          <ActivityIndicator size="large" color={colors.primary} accessibilityLabel="Loading" />
        )}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: space.lg },
  logo: {
    width: 80,
    height: 80,
    borderRadius: radius.lg,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
