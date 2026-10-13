import { zodResolver } from '@hookform/resolvers/zod';
import { useLocalSearchParams } from 'expo-router';
import { ShieldCheck } from 'lucide-react-native';
import { useForm } from 'react-hook-form';
import { StyleSheet, View } from 'react-native';
import { AppText } from '@/components/ui/app-text';
import { Notice } from '@/components/ui/bits';
import { Button } from '@/components/ui/button';
import { FormField } from '@/components/ui/form-field';
import { Screen } from '@/components/ui/screen';
import { completeSignIn } from '@/features/auth/auth-actions';
import { activateSchema, DEVICE, type ActivateValues } from '@/features/auth/schemas';
import { sanitizeCode, sanitizePhone } from '@/lib/phone';
import { errorMessage, fieldErrors } from '@/lib/errors';
import { useActivateMutation } from '@/services/api/patient-api';
import { useAppDispatch } from '@/store';
import { space } from '@/theme/tokens';

export default function ActivateScreen() {
  const dispatch = useAppDispatch();
  const params = useLocalSearchParams<{ phone?: string }>();
  const [activate, { isLoading, error }] = useActivateMutation();
  const form = useForm<ActivateValues>({
    resolver: zodResolver(activateSchema),
    defaultValues: { phone: params.phone ?? '', code: '', password: '', confirm: '' },
  });

  const submit = form.handleSubmit(async ({ phone, code, password }) => {
    try {
      const session = await activate({ phone, code, password, device: DEVICE }).unwrap();
      await dispatch(completeSignIn(session));
    } catch (err) {
      for (const [field, message] of Object.entries(fieldErrors(err))) {
        if (field === 'phone' || field === 'code' || field === 'password') form.setError(field, { message });
      }
    }
  });

  return (
    <Screen keyboard>
      <View style={styles.intro}>
        <AppText tone="muted">
          Enter the phone number the clinic has for you and the 6-digit code they gave you. Then choose your
          own password. The code works once and expires after 24 hours.
        </AppText>
      </View>
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
      />
      <FormField
        control={form.control}
        name="code"
        sanitize={sanitizeCode}
        label="Activation code"
        placeholder="6 digits"
        keyboardType="number-pad"
        maxLength={6}
        autoComplete="one-time-code"
        textContentType="oneTimeCode"
      />
      <FormField
        control={form.control}
        name="password"
        label="New password"
        password
        hint="At least 8 characters, with letters and numbers"
        autoComplete="new-password"
        textContentType="newPassword"
      />
      <FormField
        control={form.control}
        name="confirm"
        label="Confirm password"
        password
        autoComplete="new-password"
        textContentType="newPassword"
        returnKeyType="go"
        onSubmitEditing={() => void submit()}
      />
      <Button
        label="Set up and sign in"
        icon={ShieldCheck}
        loading={isLoading}
        onPress={() => void submit()}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  intro: { gap: space.sm },
});
