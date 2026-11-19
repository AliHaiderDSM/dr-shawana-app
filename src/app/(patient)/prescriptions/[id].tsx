import { router, useLocalSearchParams } from 'expo-router';
import { CalendarCheck, CalendarDays, Download, MessageSquarePlus, Stethoscope } from 'lucide-react-native';
import { useState } from 'react';
import { Alert, StyleSheet, View } from 'react-native';
import { CardSkeleton, ErrorState } from '@/components/feedback/states';
import { PrescriptionHeading, PrescriptionSections } from '@/components/prescription-sections';
import { AppText } from '@/components/ui/app-text';
import { InfoRow, Notice } from '@/components/ui/bits';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Screen } from '@/components/ui/screen';
import { useRefresh } from '@/hooks/use-refresh';
import { formatDate, htmlToText } from '@/lib/format';
import { sharePrescriptionPdf } from '@/lib/prescription-pdf';
import { useGetMeQuery } from '@/redux/features/patient';
import { space } from '@/theme/tokens';
import { useGetPrescriptionQuery } from '@/redux/features/prescriptions';

export default function PrescriptionDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const prescription = useGetPrescriptionQuery(id ?? '', { skip: !id });
  const { refreshing, onRefresh } = useRefresh(prescription.refetch);
  const p = prescription.data;
  const me = useGetMeQuery().data;
  const [saving, setSaving] = useState(false);

  const download = async () => {
    if (!p || saving) return;
    setSaving(true);
    try {
      await sharePrescriptionPdf(p, me);
    } catch {
      Alert.alert('Could not make the PDF', 'Please try again.');
    } finally {
      setSaving(false);
    }
  };

  if (prescription.isLoading) {
    return (
      <Screen>
        <CardSkeleton count={3} />
      </Screen>
    );
  }
  if (!p) {
    return (
      <Screen>
        <ErrorState
          error={prescription.error}
          onRetry={prescription.refetch}
          retrying={prescription.isFetching}
        />
      </Screen>
    );
  }

  const plan = htmlToText(p.planTreatment);

  return (
    <Screen refreshing={refreshing} onRefresh={onRefresh}>
      <Card>
        <AppText variant="caption" tone="muted">
          Prescription #{p.prescriptionNo}
        </AppText>
        <AppText variant="heading" accessibilityRole="header">
          {p.doctor ? `Prescription by ${p.doctor}` : 'Your prescription'}
        </AppText>
        <InfoRow icon={CalendarDays} label="Date" value={formatDate(p.date)} />
        {p.doctor ? <InfoRow icon={Stethoscope} label="Doctor" value={p.doctor} /> : null}
        {p.followupDate ? (
          <InfoRow icon={CalendarCheck} label="Follow-up" value={formatDate(p.followupDate)} />
        ) : null}
      </Card>

      <Card>
        <View style={styles.document}>
          {p.diagnosis?.trim() ? (
            <View style={styles.block}>
              <PrescriptionHeading title="Diagnosis" />
              <AppText selectable>{p.diagnosis.trim()}</AppText>
            </View>
          ) : null}

          <PrescriptionSections items={p.items} />

          {plan || p.followupDate ? (
            <View style={styles.block}>
              <PrescriptionHeading title="Plan of treatment" />
              {plan ? <AppText selectable>{plan}</AppText> : null}
              {p.followupDate ? (
                <AppText variant="label">
                  <AppText variant="label" weight="semibold">
                    Follow up date:{' '}
                  </AppText>
                  {formatDate(p.followupDate)}
                </AppText>
              ) : null}
            </View>
          ) : null}
        </View>
      </Card>

      <Button label="Download PDF" icon={Download} loading={saving} onPress={() => void download()} />
      {p.appointmentId ? (
        <Button
          label="View the visit"
          variant="secondary"
          onPress={() => router.push(`/appointments/${p.appointmentId}`)}
        />
      ) : null}

      <Notice>Take medicines only as your doctor advised. Questions about this prescription?</Notice>
      <Button
        label="Ask about this prescription"
        icon={MessageSquarePlus}
        variant="secondary"
        onPress={() => router.push({ pathname: '/contact', params: { category: 'prescription' } })}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  document: { gap: space.lg },
  block: { gap: space.sm },
});
