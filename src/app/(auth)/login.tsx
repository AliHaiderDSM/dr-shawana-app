import { zodResolver } from '@hookform/resolvers/zod';
import { router } from 'expo-router';
import { HeartPulse, KeyRound, LogIn } from 'lucide-react-native';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { StyleSheet, View } from 'react-native';
import { AppText } from '@/components/ui/app-text';
import { Notice } from '@/components/ui/bits';
import { Button } from '@/components/ui/button';
import { FormField } from '@/components/ui/form-field';
import { Screen } from '@/components/ui/screen';
import { completeSignIn } from '@/features/auth/auth-actions';
import { noticeSeen } from '@/features/auth/auth-slice';
import { DEVICE, loginSchema, type LoginValues } from '@/features/auth/schemas';
import { sanitizePhone } from '@/lib/phone';
import { errorMessage, errorStatus } from '@/lib/errors';
import { useLoginMutation } from '@/services/api/patient-api';
import { useAppDispatch, useAppSelector } from '@/store';
import { colors, radius, space } from '@/theme/tokens';

export default function LoginScreen() {
  const dispatch = useAppDispatch();
  const notice = useAppSelector((s) => s.auth.notice);
  const [login, { isLoading, error, reset }] = useLoginMutation();
  const form = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { phone: '', password: '' },
  });

  const [codeEntered, setCodeEntered] = useState(false);

  const openSetup = () =>
    router.push({ pathname: '/activate', params: { phone: form.getValues('phone').trim() } });

  const submit = form.handleSubmit(async (values) => {
    dispatch(noticeSeen());
    if (/^\d{6}$/.test(values.password.trim())) {
      reset();
      setCodeEntered(true);
      return;
    }
    setCodeEntered(false);
    const session = await login({ ...values, device: DEVICE })
      .unwrap()
      .catch(() => null);
    if (session) await dispatch(completeSignIn(session));
  });

  return (
    <Screen keyboard edges={['top', 'bottom', 'left', 'right']} contentStyle={styles.content}>
      <View style={styles.brand}>
        <View style={styles.logo}>
          <HeartPulse size={34} color={colors.primary} />
        </View>
        <AppText variant="title" center accessibilityRole="header">
          Welcome backs
        </AppText>
        <AppText tone="muted" center>
          Sign in to see your appointments, prescriptions and reports.
        </AppText>
      </View>

      {notice ? <Notice tone="warning">{notice}</Notice> : null}
      {codeEntered ? (
        <Notice tone="warning">
          <AppText variant="label" weight="semibold">
            That looks like the 6-digit code from the clinic.
          </AppText>
          <AppText variant="label">
            The code is used once, under Set up my account, to choose your password. Log in with that password
            after that.
          </AppText>
          <Button label="Set up my account" icon={KeyRound} variant="secondary" onPress={openSetup} />
        </Notice>
      ) : error ? (
        <Notice tone="warning">
          <AppText variant="label">{errorMessage(error)}</AppText>
          {errorStatus(error) === 401 ? (
            <AppText variant="label">
              First time, or the clinic gave you a code? Use Set up my account below.
            </AppText>
          ) : null}
        </Notice>
      ) : null}

      <View style={styles.form}>
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
          password
          autoComplete="current-password"
          textContentType="password"
          returnKeyType="go"
          onSubmitEditing={() => void submit()}
        />
        <Button label="Log in" icon={LogIn} loading={isLoading} onPress={() => void submit()} />
        <Button label="Forgot password?" variant="ghost" onPress={() => router.push('/forgot-password')} />
      </View>

      <View style={styles.divider} />

      <View style={styles.form}>
        <AppText variant="label" tone="muted" center>
          First time here? Ask the clinic for your 6-digit activation code.
        </AppText>
        <Button label="Set up my account" icon={KeyRound} variant="secondary" onPress={openSetup} />
      </View>
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
  divider: { height: StyleSheet.hairlineWidth, backgroundColor: colors.border, marginVertical: space.sm },
});
