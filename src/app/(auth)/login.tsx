import { zodResolver } from '@hookform/resolvers/zod';
import { router } from 'expo-router';
import { HeartPulse, LogIn, Stethoscope } from 'lucide-react-native';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
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
  useDoctorLoginMutation,
  useLoginMutation,
  usePasswordLoginMutation,
  type Session,
} from '@/redux/features/auth';

type Mode = 'password' | 'code';
type Who = 'patient' | 'doctor';

function Switch<T extends string>({
  value,
  options,
  onChange,
}: {
  value: T;
  options: readonly (readonly [T, string])[];
  onChange: (value: T) => void;
}) {
  return (
    <View style={styles.switch} accessibilityRole="tablist">
      {options.map(([option, label]) => (
        <Pressable
          key={option}
          accessibilityRole="tab"
          accessibilityState={{ selected: value === option }}
          onPress={() => onChange(option)}
          style={[styles.tab, value === option && styles.tabActive]}
        >
          <AppText variant="label" weight="semibold" tone={value === option ? undefined : 'muted'} center>
            {label}
          </AppText>
        </Pressable>
      ))}
    </View>
  );
}

const doctorSchema = z.object({
  identifier: z.string().trim().min(3, 'Enter your email or username').max(150),
  password: z.string().min(1, 'Enter your password').max(72),
});

function DoctorForm() {
  const dispatch = useAppDispatch();
  const [login, { isLoading, error, reset }] = useDoctorLoginMutation();
  const [problem, setProblem] = useState<string | null>(null);
  const form = useForm<z.infer<typeof doctorSchema>>({
    resolver: zodResolver(doctorSchema),
    defaultValues: { identifier: '', password: '' },
  });
  const submit = form.handleSubmit(async (values) => {
    setProblem(null);
    const session = await login(values)
      .unwrap()
      .catch(() => null);
    if (!session) return;
    if (session.me.role !== 'doctor') {
      setProblem('This login is not a doctor account. Use the dashboard for other staff roles.');
      return;
    }
    dispatch(noticeSeen());
    await dispatch(
      completeSignIn({ accessToken: session.accessToken, refreshToken: session.refreshToken }, 'doctor'),
    );
  });
  const shown = problem ?? (error ? errorMessage(error) : null);
  return (
    <View style={styles.form}>
      {shown ? <Notice tone="warning">{shown}</Notice> : null}
      <FormField
        control={form.control}
        name="identifier"
        label="Email or username"
        autoCapitalize="none"
        autoComplete="username"
        textContentType="username"
        returnKeyType="next"
        onChange={() => (error || problem) && (reset(), setProblem(null))}
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
        onChange={() => (error || problem) && (reset(), setProblem(null))}
      />
      <Button label="Log in as doctor" icon={Stethoscope} loading={isLoading} onPress={() => void submit()} />
      <AppText variant="label" tone="muted" center>
        Use the same email or username and password as the clinic dashboard.
      </AppText>
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
  const [who, setWho] = useState<Who>('patient');

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
          {who === 'doctor'
            ? 'Doctors: see your patients, their records and chat with them.'
            : mode === 'password'
              ? 'Log in with your phone number and your password.'
              : 'First time? Log in with your phone number and the 6-digit code from the clinic.'}
        </AppText>
      </View>

      {notice ? <Notice tone="warning">{notice}</Notice> : null}

      <Switch
        value={who}
        onChange={setWho}
        options={[
          ['patient', 'I am a patient'],
          ['doctor', 'I am a doctor'],
        ]}
      />
      {who === 'doctor' ? (
        <DoctorForm />
      ) : (
        <>
          <Switch
            value={mode}
            onChange={setMode}
            options={[
              ['password', 'Password'],
              ['code', 'Code from clinic'],
            ]}
          />
          {mode === 'password' ? <PasswordForm onSession={onSession} /> : <CodeForm onSession={onSession} />}
        </>
      )}
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
