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
import {
  type DoctorProfile,
  useGetDoctorProfileQuery,
  useUpdateDoctorProfileMutation,
} from '@/redux/features/doctor';

const schema = z.object({
  displayName: z.string().trim().min(1, 'Enter the name patients see').max(150),
  firstName: z.string().trim().min(1, 'Enter your first name').max(100),
  lastName: z.string().trim().min(1, 'Enter your last name').max(100),
  phone: z
    .string()
    .trim()
    .max(30)
    .refine((v) => v === '' || /^[+\d\s()-]{7,30}$/.test(v), 'Enter a phone number, e.g. 0300 1234567'),
  details: z.string().trim().max(5000),
});

type Values = z.infer<typeof schema>;

function EditForm({ profile }: { profile: DoctorProfile }) {
  const [update, { isLoading, error }] = useUpdateDoctorProfileMutation();
  const form = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: {
      displayName: profile.displayName,
      firstName: profile.firstName,
      lastName: profile.lastName,
      phone: profile.phone ?? '',
      details: profile.details ?? '',
    },
  });

  const submit = form.handleSubmit(async (values) => {
    const ok = await update({
      displayName: values.displayName,
      firstName: values.firstName,
      lastName: values.lastName,
      phone: values.phone || null,
      details: values.details || null,
    })
      .unwrap()
      .then(() => true)
      .catch(() => false);
    if (ok)
      Alert.alert('Profile saved', 'Patients and the clinic see your updated details.', [
        { text: 'OK', onPress: () => router.back() },
      ]);
  });

  return (
    <Screen
      keyboard
      footer={
        <Button
          label="Save profile"
          icon={Save}
          loading={isLoading}
          disabled={!form.formState.isDirty}
          onPress={() => void submit()}
        />
      }
    >
      <AppText tone="muted">
        Your email ({profile.email}) and username stay the same. Ask the clinic admin to change them.
      </AppText>
      {error ? <Notice tone="warning">{errorMessage(error)}</Notice> : null}
      <FormField
        control={form.control}
        name="displayName"
        label="Name patients see"
        placeholder="e.g. Dr. Shawana Malik"
        autoComplete="name"
      />
      <FormField control={form.control} name="firstName" label="First name" autoComplete="given-name" />
      <FormField control={form.control} name="lastName" label="Last name" autoComplete="family-name" />
      <FormField
        control={form.control}
        name="phone"
        label="Phone number"
        placeholder="0300 1234567"
        keyboardType="phone-pad"
        autoComplete="tel"
        maxLength={30}
      />
      <AppText variant="caption" tone="muted">
        You can also log in to the app with this phone number.
      </AppText>
      <FormField
        control={form.control}
        name="details"
        label="Qualification and speciality"
        placeholder="e.g. MBBS, FCPS (Gynae)"
        multiline
        maxLength={5000}
      />
    </Screen>
  );
}

export default function DoctorProfileEditScreen() {
  const profile = useGetDoctorProfileQuery();
  if (profile.isLoading)
    return (
      <Screen>
        <CardSkeleton count={2} />
      </Screen>
    );
  if (!profile.data)
    return (
      <Screen>
        <ErrorState error={profile.error} onRetry={profile.refetch} retrying={profile.isFetching} />
      </Screen>
    );
  return <EditForm profile={profile.data} />;
}
