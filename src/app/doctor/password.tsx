import { zodResolver } from '@hookform/resolvers/zod';
import { router } from 'expo-router';
import { KeyRound } from 'lucide-react-native';
import { useForm } from 'react-hook-form';
import { Alert } from 'react-native';
import { z } from 'zod';
import { AppText } from '@/components/ui/app-text';
import { Notice } from '@/components/ui/bits';
import { Button } from '@/components/ui/button';
import { FormField } from '@/components/ui/form-field';
import { Screen } from '@/components/ui/screen';
import { errorMessage } from '@/lib/errors';
import { useChangeDoctorPasswordMutation } from '@/redux/features/doctor';

const schema = z
  .object({
    currentPassword: z.string().min(1, 'Enter your current password').max(72),
    password: z
      .string()
      .min(8, 'Use at least 8 characters')
      .max(72, 'Use at most 72 characters')
      .refine((v) => v.trim().length === v.length, 'Do not start or end with a space'),
    confirm: z.string(),
  })
  .refine((v) => v.password === v.confirm, {
    path: ['confirm'],
    message: 'The two passwords are not the same',
  })
  .refine((v) => v.password !== v.currentPassword, {
    path: ['password'],
    message: 'Use a different password from the current one',
  });

type Values = z.infer<typeof schema>;

export default function DoctorPasswordScreen() {
  const [change, { isLoading, error, reset }] = useChangeDoctorPasswordMutation();
  const form = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: { currentPassword: '', password: '', confirm: '' },
  });

  const submit = form.handleSubmit(async (values) => {
    const ok = await change({ currentPassword: values.currentPassword, newPassword: values.password })
      .unwrap()
      .then(() => true)
      .catch(() => false);
    if (ok)
      Alert.alert('Password changed', 'Use the new password next time, on the app and the dashboard.', [
        { text: 'OK', onPress: () => router.back() },
      ]);
  });

  return (
    <Screen
      keyboard
      footer={
        <Button label="Change password" icon={KeyRound} loading={isLoading} onPress={() => void submit()} />
      }
    >
      <AppText tone="muted">The same password works on the app and the clinic dashboard.</AppText>
      {error ? <Notice tone="warning">{errorMessage(error)}</Notice> : null}
      <FormField
        control={form.control}
        name="currentPassword"
        label="Current password"
        secureTextEntry
        autoCapitalize="none"
        autoComplete="current-password"
        textContentType="password"
        onChange={() => error && reset()}
      />
      <FormField
        control={form.control}
        name="password"
        label="New password"
        secureTextEntry
        autoCapitalize="none"
        autoComplete="new-password"
        textContentType="newPassword"
      />
      <FormField
        control={form.control}
        name="confirm"
        label="New password again"
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
