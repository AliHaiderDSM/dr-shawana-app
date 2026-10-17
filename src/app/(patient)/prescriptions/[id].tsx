import { router, useLocalSearchParams } from 'expo-router';
import { CalendarCheck, CalendarDays, Download, MessageSquarePlus, Stethoscope } from 'lucide-react-native';
import { useState } from 'react';
import { Alert, StyleSheet, View } from 'react-native';
import { CardSkeleton, ErrorState } from '@/components/feedback/states';
import { AppText } from '@/components/ui/app-text';
import { InfoRow, Notice, SectionHeader } from '@/components/ui/bits';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Screen } from '@/components/ui/screen';
import { StatusBadge } from '@/components/ui/status-badge';
import { useRefresh } from '@/hooks/use-refresh';
import { formatDate, htmlToText } from '@/lib/format';
import { PRESCRIPTION_CATEGORY_LABELS } from '@/lib/labels';
import { sharePrescriptionPdf } from '@/lib/prescription-pdf';
import { useGetMeQuery } from '@/redux/features/patient';
import { colors, space } from '@/theme/tokens';
import { type PrescriptionItem, useGetPrescriptionQuery } from '@/redux/features/prescriptions';

function groupItems(items: PrescriptionItem[]) {
  const groups = new Map<string, PrescriptionItem[]>();
  for (const item of items) {
    const key = PRESCRIPTION_CATEGORY_LABELS[item.category] ?? 'Other';
    groups.set(key, [...(groups.get(key) ?? []), item]);
  }
  return [...groups.entries()];
}

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

      {p.diagnosis?.trim() ? (
        <>
          <SectionHeader title="Diagnosis" />
          <Card>
            <AppText selectable>{p.diagnosis.trim()}</AppText>
          </Card>
        </>
      ) : null}

      <Button label="Download PDF" icon={Download} loading={saving} onPress={() => void download()} />

      {p.appointmentId ? (
        <Button
          label="View the visit"
          variant="secondary"
          onPress={() => router.push(`/appointments/${p.appointmentId}`)}
        />
      ) : null}

      {groupItems(p.items).map(([group, items]) => (
        <View key={group} style={styles.group}>
          <SectionHeader title={group} />
          <Card>
            {items.map((item, index) => (
              <View key={item.id} style={[styles.item, index > 0 && styles.itemBorder]}>
                <View style={styles.itemHead}>
                  <AppText weight="semibold" style={styles.flex}>
                    {item.name}
                  </AppText>
                  {item.optional ? <StatusBadge label="Optional" tone="neutral" /> : null}
                </View>
                {item.dose ? <AppText variant="label">{item.dose}</AppText> : null}
                {item.instructions ? (
                  <AppText variant="label" tone="muted">
                    {item.instructions}
                  </AppText>
                ) : null}
              </View>
            ))}
          </Card>
        </View>
      ))}

      {plan ? (
        <>
          <SectionHeader title="Plan and advice" />
          <Card>
            <AppText selectable>{plan}</AppText>
          </Card>
        </>
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
  group: { gap: space.sm },
  item: { gap: space.xs, paddingVertical: space.sm },
  itemBorder: { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.border },
  itemHead: { flexDirection: 'row', alignItems: 'center', gap: space.sm },
  flex: { flex: 1, minWidth: 0 },
});
