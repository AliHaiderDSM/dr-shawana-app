import { zodResolver } from '@hookform/resolvers/zod';
import { KeyRound } from 'lucide-react-native';
import { useForm } from 'react-hook-form';
import { AppText } from '@/components/ui/app-text';
import { Notice } from '@/components/ui/bits';
import { Button } from '@/components/ui/button';
import { FormField } from '@/components/ui/form-field';
import { Screen } from '@/components/ui/screen';
import { errorMessage } from '@/lib/errors';
import { sanitizeCode, sanitizePhone } from '@/lib/phone';
import { useAppDispatch } from '@/redux/hooks';
import { completeSignIn, noticeSeen, useResetPasswordMutation } from '@/redux/features/auth';
import { DEVICE, resetPasswordSchema, type ResetPasswordValues } from '@/utils/login';

export default function ForgotPasswordScreen() {
  const dispatch = useAppDispatch();
  const [resetPassword, { isLoading, error, reset }] = useResetPasswordMutation();
  const form = useForm<ResetPasswordValues>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: { phone: '', code: '', password: '', confirm: '' },
  });

  const submit = form.handleSubmit(async ({ phone, code, password }) => {
    dispatch(noticeSeen());
    const session = await resetPassword({ phone, code, password, device: DEVICE })
      .unwrap()
      .catch(() => null);
    if (session) await dispatch(completeSignIn(session));
  });

  return (
    <Screen
      keyboard
      footer={
        <Button label="Save new password" icon={KeyRound} loading={isLoading} onPress={() => void submit()} />
      }
    >
      <AppText tone="muted">
        Call or visit the clinic and ask for a new 6-digit login code. Enter it here with your new password.
        You will be logged out on other phones.
      </AppText>
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
        onChange={() => error && reset()}
      />
      <FormField
        control={form.control}
        name="code"
        sanitize={sanitizeCode}
        label="Code from the clinic"
        placeholder="6 digits"
        keyboardType="number-pad"
        maxLength={6}
        autoComplete="one-time-code"
        textContentType="oneTimeCode"
        onChange={() => error && reset()}
      />
      <FormField
        control={form.control}
        name="password"
        label="New password"
        hint="At least 6 characters"
        secureTextEntry
        autoCapitalize="none"
        autoComplete="new-password"
        textContentType="newPassword"
      />
      <FormField
        control={form.control}
        name="confirm"
        label="Type the new password again"
        secureTextEntry
        autoCapitalize="none"
        autoComplete="new-password"
        textContentType="newPassword"
        returnKeyType="go"
        onSubmitEditing={() => void submit()}
      />
    </Screen>
  );
}
