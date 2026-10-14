import { zodResolver } from '@hookform/resolvers/zod';
import { HeartPulse, LogIn } from 'lucide-react-native';
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
import { errorMessage } from '@/lib/errors';
import { sanitizeCode, sanitizePhone } from '@/lib/phone';
import { useLoginMutation } from '@/services/api/patient-api';
import { useAppDispatch, useAppSelector } from '@/store';
import { colors, radius, space } from '@/theme/tokens';

export default function LoginScreen() {
  const dispatch = useAppDispatch();
  const notice = useAppSelector((s) => s.auth.notice);
  const [login, { isLoading, error, reset }] = useLoginMutation();
  const form = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { phone: '', code: '' },
  });

  const submit = form.handleSubmit(async (values) => {
    dispatch(noticeSeen());
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
          Welcome back
        </AppText>
        <AppText tone="muted" center>
          Log in with your phone number and the 6-digit code from the clinic.
        </AppText>
      </View>

      {notice ? <Notice tone="warning">{notice}</Notice> : null}
      {error ? <Notice tone="warning">{errorMessage(error)}</Notice> : null}

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
      </View>

      <AppText variant="label" tone="muted" center>
        No code? Ask the clinic at your visit or by phone. Each code works once, for 24 hours.
      </AppText>
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
});
