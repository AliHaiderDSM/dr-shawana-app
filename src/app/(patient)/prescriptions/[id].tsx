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
import { prescriptionBlocks } from '@/lib/prescription-blocks';
import { sharePrescriptionPdf } from '@/lib/prescription-pdf';
import { useGetMeQuery } from '@/redux/features/patient';
import { colors, radius, space } from '@/theme/tokens';
import { type PrescriptionItem, useGetPrescriptionQuery } from '@/redux/features/prescriptions';

function ItemRow({ item, first }: { item: PrescriptionItem; first: boolean }) {
  return (
    <View style={[styles.item, !first && styles.itemBorder]}>
      <View style={styles.itemHead}>
        <View style={styles.bullet} />
        <AppText weight="semibold" style={styles.flex}>
          {item.name}
        </AppText>
        {item.optional ? <StatusBadge label="Optional" tone="neutral" /> : null}
      </View>
      {item.dose ? (
        <AppText variant="label" style={styles.indent}>
          {item.dose}
        </AppText>
      ) : null}
      {item.instructions ? (
        <AppText variant="label" tone="muted" style={styles.indent}>
          How to use: {item.instructions}
        </AppText>
      ) : null}
    </View>
  );
}

function BlockHeading({ title }: { title: string }) {
  return (
    <View style={styles.blockHeading}>
      <AppText variant="label" weight="bold" tone="primary" accessibilityRole="header" style={styles.upper}>
        {title}
      </AppText>
    </View>
  );
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

      {prescriptionBlocks(p.items).map((block) => (
        <Card key={block.title}>
          <BlockHeading title={block.title} />
          {block.groups.map((group) => (
            <View key={group.name} style={styles.group}>
              <AppText variant="caption" weight="semibold" tone="muted">
                {group.name}
              </AppText>
              {group.items.map((item, index) => (
                <ItemRow key={item.id} item={item} first={index === 0} />
              ))}
            </View>
          ))}
        </Card>
      ))}

      {plan || p.followupDate ? (
        <Card>
          <BlockHeading title="Plan of treatment" />
          {plan ? <AppText selectable>{plan}</AppText> : null}
          {p.followupDate ? (
            <AppText variant="label">
              <AppText variant="label" weight="semibold">
                Follow up date:{' '}
              </AppText>
              {formatDate(p.followupDate)}
            </AppText>
          ) : null}
        </Card>
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
  group: { gap: space.xxs, marginTop: space.xs },
  item: { gap: space.xxs, paddingVertical: space.sm },
  itemBorder: { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.border },
  itemHead: { flexDirection: 'row', alignItems: 'center', gap: space.sm },
  bullet: { width: 6, height: 6, borderRadius: radius.pill, backgroundColor: colors.primary },
  indent: { paddingLeft: space.md },
  blockHeading: {
    paddingBottom: space.xs,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  upper: { textTransform: 'uppercase', letterSpacing: 0.6 },
  flex: { flex: 1, minWidth: 0 },
});
