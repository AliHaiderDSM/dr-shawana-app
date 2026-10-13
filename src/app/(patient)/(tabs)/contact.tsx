import { zodResolver } from '@hookform/resolvers/zod';
import { router, useLocalSearchParams } from 'expo-router';
import { CheckCircle2, ListChecks, Send } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { StyleSheet, View } from 'react-native';
import { z } from 'zod';
import { AppText } from '@/components/ui/app-text';
import { ChoiceChips, Notice } from '@/components/ui/bits';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { FormField } from '@/components/ui/form-field';
import { Screen } from '@/components/ui/screen';
import { StatusBadge } from '@/components/ui/status-badge';
import { errorMessage, fieldErrors } from '@/lib/errors';
import { REQUEST_CATEGORY_LABELS, REQUEST_STATUS } from '@/lib/labels';
import { useCreateRequestMutation } from '@/services/api/patient-api';
import { colors, radius, space } from '@/theme/tokens';
import { REQUEST_CATEGORIES, type ManagementRequest, type RequestCategory } from '@/types/api';

const schema = z.object({
  category: z.enum(REQUEST_CATEGORIES, { message: 'Choose what your request is about' }),
  subject: z
    .string()
    .trim()
    .min(3, 'Write a short subject')
    .max(150, 'Keep the subject under 150 characters'),
  message: z
    .string()
    .trim()
    .min(10, 'Write at least 10 characters')
    .max(4000, 'Keep the message under 4000 characters'),
});

type Values = z.input<typeof schema>;

const OPTIONS = REQUEST_CATEGORIES.map((value) => ({ value, label: REQUEST_CATEGORY_LABELS[value] }));

function Success({ request, onAnother }: { request: ManagementRequest; onAnother: () => void }) {
  const status = REQUEST_STATUS[request.status];
  return (
    <View style={styles.success} accessibilityLiveRegion="polite">
      <View style={styles.successIcon}>
        <CheckCircle2 size={36} color={colors.success} />
      </View>
      <AppText variant="heading" center accessibilityRole="header">
        Request sent
      </AppText>
      <AppText tone="muted" center>
        The clinic team will look at it and reply here. Keep this number for reference.
      </AppText>
      <Card style={styles.successCard}>
        <AppText variant="caption" tone="muted">
          Request number
        </AppText>
        <AppText variant="heading" selectable>
          {request.requestNo}
        </AppText>
        <StatusBadge label={status.label} tone={status.tone} icon={status.icon} />
      </Card>
      <Button label="View request" onPress={() => router.push(`/requests/${request.id}`)} />
      <Button label="Send another request" variant="ghost" onPress={onAnother} />
    </View>
  );
}

export default function ContactScreen() {
  const params = useLocalSearchParams<{ category?: string }>();
  const [createRequest, { isLoading, error, reset }] = useCreateRequestMutation();
  const [sent, setSent] = useState<ManagementRequest | null>(null);
  const form = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: { category: undefined, subject: '', message: '' },
  });

  useEffect(() => {
    const category = params.category;
    if (category && (REQUEST_CATEGORIES as readonly string[]).includes(category)) {
      form.setValue('category', category as RequestCategory);
    }
  }, [params.category, form]);

  const submit = form.handleSubmit(async (values) => {
    if (isLoading) return;
    try {
      const created = await createRequest({
        category: values.category,
        subject: values.subject.trim(),
        message: values.message.trim(),
      }).unwrap();
      form.reset({ category: undefined, subject: '', message: '' });
      setSent(created);
    } catch (err) {
      for (const [field, message] of Object.entries(fieldErrors(err))) {
        if (field === 'category' || field === 'subject' || field === 'message')
          form.setError(field, { message });
      }
    }
  });

  if (sent) {
    return (
      <Screen>
        <Success
          request={sent}
          onAnother={() => {
            reset();
            setSent(null);
          }}
        />
      </Screen>
    );
  }

  return (
    <Screen
      keyboard
      footer={<Button label="Send request" icon={Send} loading={isLoading} onPress={() => void submit()} />}
    >
      <Notice tone="warning">
        <AppText variant="label" weight="semibold">
          Not for emergencies.
        </AppText>
        <AppText variant="label">
          If you feel very unwell, call emergency services or go to the nearest hospital. This form reaches
          the clinic office during working hours.
        </AppText>
      </Notice>

      <Button
        label="My requests and replies"
        icon={ListChecks}
        variant="secondary"
        onPress={() => router.push('/requests')}
      />

      {error ? <Notice tone="warning">{errorMessage(error)}</Notice> : null}

      <Controller
        control={form.control}
        name="category"
        render={({ field, fieldState }) => (
          <ChoiceChips
            label="What is it about?"
            options={OPTIONS}
            value={field.value}
            onChange={field.onChange}
            error={fieldState.error?.message}
          />
        )}
      />
      <FormField control={form.control} name="subject" label="Subject" maxLength={150} returnKeyType="next" />
      <FormField
        control={form.control}
        name="message"
        label="Message"
        multiline
        maxLength={4000}
        counter={4000}
        hint="Your name and phone are added for you. Please don't share more medical detail than needed."
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  success: { alignItems: 'stretch', gap: space.lg, paddingTop: space.xl },
  successIcon: {
    alignSelf: 'center',
    width: 72,
    height: 72,
    borderRadius: radius.pill,
    backgroundColor: colors.successSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  successCard: { alignItems: 'flex-start' },
});
