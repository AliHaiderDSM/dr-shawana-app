import { zodResolver } from '@hookform/resolvers/zod';
import { router } from 'expo-router';
import { Save } from 'lucide-react-native';
import { useForm } from 'react-hook-form';
import { Alert } from 'react-native';
import { AppText } from '@/components/ui/app-text';
import { Notice } from '@/components/ui/bits';
import { Button } from '@/components/ui/button';
import { FormField } from '@/components/ui/form-field';
import { Screen } from '@/components/ui/screen';
import { changePasswordSchema, type ChangePasswordValues } from '@/features/auth/schemas';
import { errorMessage } from '@/lib/errors';
import { useChangePasswordMutation } from '@/services/api/patient-api';

export default function ChangePasswordScreen() {
  const [change, { isLoading, error }] = useChangePasswordMutation();
  const form = useForm<ChangePasswordValues>({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: { currentPassword: '', newPassword: '', confirm: '' },
  });

  const submit = form.handleSubmit(async ({ currentPassword, newPassword }) => {
    const ok = await change({ currentPassword, newPassword })
      .unwrap()
      .then(() => true)
      .catch(() => false);
    if (!ok) return;
    form.reset();
    Alert.alert('Password changed', 'Other phones signed in to your account have been signed out.', [
      { text: 'OK', onPress: () => router.back() },
    ]);
  });

  return (
    <Screen
      keyboard
      footer={
        <Button label="Save new password" icon={Save} loading={isLoading} onPress={() => void submit()} />
      }
    >
      <AppText tone="muted">Use at least 8 characters with letters and numbers.</AppText>
      {error ? <Notice tone="warning">{errorMessage(error)}</Notice> : null}
      <FormField
        control={form.control}
        name="currentPassword"
        label="Current password"
        password
        autoComplete="current-password"
        textContentType="password"
      />
      <FormField
        control={form.control}
        name="newPassword"
        label="New password"
        password
        autoComplete="new-password"
        textContentType="newPassword"
      />
      <FormField
        control={form.control}
        name="confirm"
        label="Confirm new password"
        password
        autoComplete="new-password"
        textContentType="newPassword"
        returnKeyType="go"
        onSubmitEditing={() => void submit()}
      />
    </Screen>
  );
}
