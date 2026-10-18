import { zodResolver } from '@hookform/resolvers/zod';
import { router, useLocalSearchParams } from 'expo-router';
import { KeyRound } from 'lucide-react-native';
import { useForm } from 'react-hook-form';
import { Alert } from 'react-native';
import { z } from 'zod';
import { CardSkeleton, ErrorState } from '@/components/feedback/states';
import { AppText } from '@/components/ui/app-text';
import { Notice } from '@/components/ui/bits';
import { Button } from '@/components/ui/button';
import { FormField } from '@/components/ui/form-field';
import { Screen } from '@/components/ui/screen';
import { errorMessage } from '@/lib/errors';
import { useGetMeQuery, useSetPasswordMutation } from '@/redux/features/patient';
import { newPassword } from '@/utils/login';

const schema = z
  .object({ currentPassword: z.string().max(72), password: newPassword, confirm: z.string() })
  .refine((v) => v.password === v.confirm, {
    path: ['confirm'],
    message: 'The two passwords are not the same',
  });

type Values = z.infer<typeof schema>;

function PasswordForm({ hasPassword, first }: { hasPassword: boolean; first: boolean }) {
  const [save, { isLoading, error, reset }] = useSetPasswordMutation();
  const form = useForm<Values>({
    resolver: zodResolver(
      hasPassword
        ? schema.refine((v) => v.currentPassword.length > 0, {
            path: ['currentPassword'],
            message: 'Enter your current password',
          })
        : schema,
    ),
    defaultValues: { currentPassword: '', password: '', confirm: '' },
  });

  const submit = form.handleSubmit(async (values) => {
    const ok = await save({
      currentPassword: hasPassword ? values.currentPassword : null,
      password: values.password,
    })
      .unwrap()
      .then(() => true)
      .catch(() => false);
    if (ok)
      Alert.alert('Password saved', 'Next time, log in with your phone number and this password.', [
        { text: 'OK', onPress: () => router.back() },
      ]);
  });

  return (
    <Screen
      keyboard
      footer={
        <>
          <Button
            label={hasPassword ? 'Change password' : 'Save password'}
            icon={KeyRound}
            loading={isLoading}
            onPress={() => void submit()}
          />
          {first ? <Button label="Skip for now" variant="ghost" onPress={() => router.back()} /> : null}
        </>
      }
    >
      <AppText tone="muted">
        {hasPassword
          ? 'Enter your current password, then the new one.'
          : 'Make a password so you can log in again without asking the clinic for a code. Keep it to yourself.'}
      </AppText>
      {error ? <Notice tone="warning">{errorMessage(error)}</Notice> : null}
      {hasPassword ? (
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
      ) : null}
      <FormField
        control={form.control}
        name="password"
        label="New password"
        hint="At least 6 characters"
        secureTextEntry
        autoCapitalize="none"
        autoComplete="new-password"
        textContentType="newPassword"
        onChange={() => error && reset()}
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

export default function PasswordScreen() {
  const { first } = useLocalSearchParams<{ first?: string }>();
  const me = useGetMeQuery();
  if (me.isLoading) {
    return (
      <Screen>
        <CardSkeleton count={1} />
      </Screen>
    );
  }
  if (!me.data) {
    return (
      <Screen>
        <ErrorState error={me.error} onRetry={me.refetch} retrying={me.isFetching} />
      </Screen>
    );
  }
  return <PasswordForm hasPassword={me.data.hasPassword} first={first === '1' && !me.data.hasPassword} />;
}
