import { zodResolver } from '@hookform/resolvers/zod';
import { router } from 'expo-router';
import { Save } from 'lucide-react-native';
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
import { useMeQuery, useUpdateMeMutation } from '@/services/api/patient-api';
import type { PatientProfile } from '@/types/api';

const toIso = (value: string) => {
  const m = value.trim().match(/^(\d{1,2})[/.-](\d{1,2})[/.-](\d{4})$/);
  if (!m) return null;
  const [, d, mo, y] = m;
  const iso = `${y}-${mo!.padStart(2, '0')}-${d!.padStart(2, '0')}`;
  const date = new Date(`${iso}T00:00:00`);
  return Number.isNaN(date.getTime()) || date > new Date() ? null : iso;
};

const fromIso = (iso: string | null) => (iso ? iso.slice(0, 10).split('-').reverse().join('/') : '');

const schema = z.object({
  name: z.string().trim().min(1, 'Enter your name').max(150),
  age: z
    .string()
    .trim()
    .refine(
      (v) => v === '' || (/^\d{1,3}$/.test(v) && Number(v) >= 1 && Number(v) <= 120),
      'Enter an age from 1 to 120',
    ),
  dateOfBirth: z
    .string()
    .trim()
    .refine((v) => v === '' || toIso(v) !== null, 'Use DD/MM/YYYY, e.g. 14/08/1980'),
  city: z.string().trim().min(1, 'Enter your city').max(100),
  country: z.string().trim().max(100),
});

type Values = z.infer<typeof schema>;

function EditForm({ profile }: { profile: PatientProfile }) {
  const [update, { isLoading, error }] = useUpdateMeMutation();
  const form = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: profile.name,
      age: profile.age !== null ? String(profile.age) : '',
      dateOfBirth: fromIso(profile.dateOfBirth),
      city: profile.city,
      country: profile.country ?? '',
    },
  });

  const submit = form.handleSubmit(async (values) => {
    const ok = await update({
      name: values.name,
      city: values.city,
      country: values.country || null,
      age: values.age ? Number(values.age) : null,
      dateOfBirth: values.dateOfBirth ? toIso(values.dateOfBirth) : null,
    })
      .unwrap()
      .then(() => true)
      .catch(() => false);
    if (ok)
      Alert.alert('Details saved', 'The clinic sees your updated details.', [
        { text: 'OK', onPress: () => router.back() },
      ]);
  });

  return (
    <Screen
      keyboard
      footer={
        <Button label="Save my details" icon={Save} loading={isLoading} onPress={() => void submit()} />
      }
    >
      <AppText tone="muted">Your phone number cannot be changed here because you log in with it.</AppText>
      {error ? <Notice tone="warning">{errorMessage(error)}</Notice> : null}
      <FormField
        control={form.control}
        name="name"
        label="Full name"
        autoComplete="name"
        textContentType="name"
      />
      <FormField
        control={form.control}
        name="age"
        label="Age"
        keyboardType="number-pad"
        maxLength={3}
        sanitize={(v) => v.replace(/\D/g, '')}
      />
      <FormField
        control={form.control}
        name="dateOfBirth"
        label="Date of birth (optional)"
        placeholder="DD/MM/YYYY"
        keyboardType="numbers-and-punctuation"
        maxLength={10}
      />
      <FormField control={form.control} name="city" label="City" autoComplete="postal-address-locality" />
      <FormField control={form.control} name="country" label="Country" autoComplete="country" />
    </Screen>
  );
}

export default function ProfileEditScreen() {
  const me = useMeQuery();
  if (me.isLoading) {
    return (
      <Screen>
        <CardSkeleton count={2} />
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
  return <EditForm profile={me.data} />;
}
