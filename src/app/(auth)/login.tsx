import { zodResolver } from '@hookform/resolvers/zod';
import { router } from 'expo-router';
import { HeartPulse, LogIn } from 'lucide-react-native';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Pressable, StyleSheet, View } from 'react-native';
import { AppText } from '@/components/ui/app-text';
import { Notice } from '@/components/ui/bits';
import { Button } from '@/components/ui/button';
import { FormField } from '@/components/ui/form-field';
import { Screen } from '@/components/ui/screen';
import {
  DEVICE,
  loginSchema,
  passwordLoginSchema,
  type LoginValues,
  type PasswordLoginValues,
} from '@/utils/login';
import { errorMessage } from '@/lib/errors';
import { sanitizeCode, sanitizePhone } from '@/lib/phone';
import { useAppDispatch, useAppSelector } from '@/redux/hooks';
import { colors, radius, space, touch } from '@/theme/tokens';
import {
  completeSignIn,
  noticeSeen,
  useLoginMutation,
  usePasswordLoginMutation,
  type Session,
} from '@/redux/features/auth';

type Mode = 'password' | 'code';

function ModeSwitch({ mode, onChange }: { mode: Mode; onChange: (mode: Mode) => void }) {
  return (
    <View style={styles.switch} accessibilityRole="tablist">
      {(
        [
          ['password', 'Password'],
          ['code', 'Code from clinic'],
        ] as const
      ).map(([value, label]) => (
        <Pressable
          key={value}
          accessibilityRole="tab"
          accessibilityState={{ selected: mode === value }}
          onPress={() => onChange(value)}
          style={[styles.tab, mode === value && styles.tabActive]}
        >
          <AppText variant="label" weight="semibold" tone={mode === value ? undefined : 'muted'} center>
            {label}
          </AppText>
        </Pressable>
      ))}
    </View>
  );
}

function PasswordForm({ onSession }: { onSession: (session: Session) => Promise<void> }) {
  const [login, { isLoading, error, reset }] = usePasswordLoginMutation();
  const form = useForm<PasswordLoginValues>({
    resolver: zodResolver(passwordLoginSchema),
    defaultValues: { phone: '', password: '' },
  });
  const submit = form.handleSubmit(async (values) => {
    const session = await login({ ...values, device: DEVICE })
      .unwrap()
      .catch(() => null);
    if (session) await onSession(session);
  });
  return (
    <View style={styles.form}>
      {error ? <Notice tone="warning">{errorMessage(error)}</Notice> : null}
      <FormField
        control={form.control}
        name="phone"
        sanitize={sanitizePhone}
        label="Phone number"
        placeholder="0300 1234567"
        keyboardType="phone-pad"
        autoComplete="tel"
        textContentType="telephoneNumber"
        returnKeyType="next"
        onChange={() => error && reset()}
      />
      <FormField
        control={form.control}
        name="password"
        label="Password"
        secureTextEntry
        autoCapitalize="none"
        autoComplete="current-password"
        textContentType="password"
        returnKeyType="go"
        onSubmitEditing={() => void submit()}
        onChange={() => error && reset()}
      />
      <Button label="Log in" icon={LogIn} loading={isLoading} onPress={() => void submit()} />
      <Button label="Forgot password?" variant="ghost" onPress={() => router.push('/forgot-password')} />
    </View>
  );
}

function CodeForm({ onSession }: { onSession: (session: Session) => Promise<void> }) {
  const [login, { isLoading, error, reset }] = useLoginMutation();
  const form = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { phone: '', code: '' },
  });
  const submit = form.handleSubmit(async (values) => {
    const session = await login({ ...values, device: DEVICE })
      .unwrap()
      .catch(() => null);
    if (session) await onSession(session);
  });
  return (
    <View style={styles.form}>
      {error ? <Notice tone="warning">{errorMessage(error)}</Notice> : null}
      <FormField
        control={form.control}
        name="phone"
        sanitize={sanitizePhone}
        label="Phone number"
        placeholder="0300 1234567"
        keyboardType="phone-pad"
        autoComplete="tel"
        textContentType="telephoneNumber"
        returnKeyType="next"
        onChange={() => error && reset()}
      />
      <FormField
        control={form.control}
        name="code"
        sanitize={sanitizeCode}
        label="Login code"
        placeholder="6 digits"
        keyboardType="number-pad"
        maxLength={6}
        autoComplete="one-time-code"
        textContentType="oneTimeCode"
        returnKeyType="go"
        onSubmitEditing={() => void submit()}
        onChange={() => error && reset()}
      />
      <Button label="Log in" icon={LogIn} loading={isLoading} onPress={() => void submit()} />
      <AppText variant="label" tone="muted" center>
        No code? Ask the clinic at your visit or by phone. Each code works once, for 24 hours. After logging
        in you can make a password.
      </AppText>
    </View>
  );
}

export default function LoginScreen() {
  const dispatch = useAppDispatch();
  const notice = useAppSelector((s) => s.auth.notice);
  const [mode, setMode] = useState<Mode>('password');

  const onSession = async (session: Session) => {
    dispatch(noticeSeen());
    await dispatch(completeSignIn(session));
  };

  return (
    <Screen keyboard edges={['top', 'bottom', 'left', 'right']} contentStyle={styles.content}>
      <View style={styles.brand}>
        <View style={styles.logo}>
          <HeartPulse size={34} color={colors.primary} />
        </View>
        <AppText variant="title" center accessibilityRole="header">
          Welcome back
        </AppText>
        <AppText tone="muted" center>
          {mode === 'password'
            ? 'Log in with your phone number and your password.'
            : 'First time? Log in with your phone number and the 6-digit code from the clinic.'}
        </AppText>
      </View>

      {notice ? <Notice tone="warning">{notice}</Notice> : null}

      <ModeSwitch mode={mode} onChange={setMode} />
      {mode === 'password' ? <PasswordForm onSession={onSession} /> : <CodeForm onSession={onSession} />}
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { paddingTop: space.xxxl },
  brand: { alignItems: 'center', gap: space.sm, marginBottom: space.sm },
  logo: {
    width: 72,
    height: 72,
    borderRadius: radius.lg,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: space.sm,
  },
  form: { gap: space.md },
  switch: {
    flexDirection: 'row',
    padding: space.xs,
    gap: space.xs,
    borderRadius: radius.md,
    backgroundColor: colors.primarySoft,
  },
  tab: {
    flex: 1,
    minHeight: touch.minHeight,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.sm,
  },
  tabActive: { backgroundColor: colors.surface },
});
