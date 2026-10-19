import { zodResolver } from '@hookform/resolvers/zod';
import { router } from 'expo-router';
import { Save } from 'lucide-react-native';
import { useForm, useWatch } from 'react-hook-form';
import { Alert, StyleSheet, View } from 'react-native';
import { z } from 'zod';
import { CardSkeleton, ErrorState } from '@/components/feedback/states';
import { AppText } from '@/components/ui/app-text';
import { Notice } from '@/components/ui/bits';
import { Button } from '@/components/ui/button';
import { FormField } from '@/components/ui/form-field';
import { Screen } from '@/components/ui/screen';
import { errorMessage } from '@/lib/errors';
import { space } from '@/theme/tokens';
import { type PatientProfile, useGetMeQuery, useUpdateMeMutation } from '@/redux/features/patient';

const toIso = (value: string) => {
  const m = value.trim().match(/^(\d{1,2})[/.-](\d{1,2})[/.-](\d{4})$/);
  if (!m) return null;
  const [, d, mo, y] = m;
  const iso = `${y}-${mo!.padStart(2, '0')}-${d!.padStart(2, '0')}`;
  const date = new Date(`${iso}T00:00:00`);
  return Number.isNaN(date.getTime()) || date > new Date() ? null : iso;
};

const fromIso = (iso: string | null) => (iso ? iso.slice(0, 10).split('-').reverse().join('/') : '');

const ageFrom = (iso: string | null) => {
  if (!iso) return null;
  const [y, m, d] = iso.split('-').map(Number) as [number, number, number];
  const now = new Date();
  let years = now.getFullYear() - y;
  if (now.getMonth() + 1 < m || (now.getMonth() + 1 === m && now.getDate() < d)) years -= 1;
  return years >= 0 && years <= 120 ? years : null;
};

const dateTyping = (value: string) => {
  const digits = value.replace(/\D/g, '').slice(0, 8);
  if (digits.length <= 2) return digits;
  if (digits.length <= 4) return `${digits.slice(0, 2)}/${digits.slice(2)}`;
  return `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4)}`;
};

const decimal = (value: string) => {
  const [whole = '', ...rest] = value
    .replace(/,/g, '.')
    .replace(/[^\d.]/g, '')
    .split('.');
  return rest.length ? `${whole.slice(0, 3)}.${rest.join('').slice(0, 1)}` : whole.slice(0, 3);
};

const measure = (min: number, max: number, message: string) =>
  z
    .string()
    .trim()
    .refine(
      (v) => v === '' || (/^\d{1,3}(\.\d?)?$/.test(v) && Number(v) >= min && Number(v) <= max),
      message,
    );

const toNumber = (value: string) => (value.trim() ? Number(value) : null);

const schema = z.object({
  name: z.string().trim().min(1, 'Enter your name').max(150),
  dateOfBirth: z
    .string()
    .trim()
    .min(1, 'Enter your date of birth')
    .refine((v) => toIso(v) !== null, 'Use DD/MM/YYYY, e.g. 14/08/1980')
    .refine((v) => ageFrom(toIso(v)) !== null, 'Check the year of birth'),
  city: z.string().trim().min(1, 'Enter your city').max(100),
  country: z.string().trim().max(100),
  weightKg: measure(1, 400, 'Enter your weight in kg, e.g. 65 or 65.5'),
  heightCm: measure(30, 260, 'Enter your height in cm, e.g. 162'),
});

type Values = z.infer<typeof schema>;

function EditForm({ profile }: { profile: PatientProfile }) {
  const [update, { isLoading, error }] = useUpdateMeMutation();
  const form = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: profile.name,
      dateOfBirth: fromIso(profile.dateOfBirth),
      city: profile.city,
      country: profile.country ?? '',
      weightKg: profile.weightKg !== null ? String(profile.weightKg) : '',
      heightCm: profile.heightCm !== null ? String(profile.heightCm) : '',
    },
  });
  const changed = form.formState.isDirty;
  const typedBirth = useWatch({ control: form.control, name: 'dateOfBirth' });
  const age = ageFrom(toIso(typedBirth ?? ''));

  const submit = form.handleSubmit(async (values) => {
    const ok = await update({
      name: values.name,
      city: values.city,
      country: values.country || null,
      age: (() => {
        const years = ageFrom(toIso(values.dateOfBirth));
        return years && years >= 1 ? years : null;
      })(),
      dateOfBirth: toIso(values.dateOfBirth),
      weightKg: toNumber(values.weightKg),
      heightCm: toNumber(values.heightCm),
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
        <Button
          label="Save my details"
          icon={Save}
          loading={isLoading}
          disabled={!changed}
          onPress={() => void submit()}
        />
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
      <View>
        <FormField
          control={form.control}
          name="dateOfBirth"
          label="Date of birth"
          placeholder="DD/MM/YYYY"
          keyboardType="number-pad"
          maxLength={10}
          sanitize={dateTyping}
        />
        {age !== null ? (
          <AppText variant="caption" tone="muted" style={styles.age}>
            Age: {age} {age === 1 ? 'year' : 'years'}
          </AppText>
        ) : null}
      </View>
      <FormField
        control={form.control}
        name="weightKg"
        label="Weight in kg (optional)"
        placeholder="e.g. 65"
        keyboardType="decimal-pad"
        maxLength={5}
        sanitize={decimal}
      />
      <FormField
        control={form.control}
        name="heightCm"
        label="Height in cm (optional)"
        placeholder="e.g. 162"
        keyboardType="decimal-pad"
        maxLength={5}
        sanitize={decimal}
      />
      <FormField control={form.control} name="city" label="City" autoComplete="postal-address-locality" />
      <FormField control={form.control} name="country" label="Country" autoComplete="country" />
    </Screen>
  );
}

export default function ProfileEditScreen() {
  const me = useGetMeQuery();
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

const styles = StyleSheet.create({
  age: { alignSelf: 'flex-end', marginTop: space.xs },
});
