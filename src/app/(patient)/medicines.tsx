import { router } from 'expo-router';
import { ChevronRight, Pill } from 'lucide-react-native';
import { Pressable, StyleSheet, View } from 'react-native';
import { EmptyState } from '@/components/feedback/states';
import { AppText } from '@/components/ui/app-text';
import { Card } from '@/components/ui/card';
import { ListScreen } from '@/components/ui/list-screen';
import { StatusBadge } from '@/components/ui/status-badge';
import { useRefresh } from '@/hooks/use-refresh';
import { formatDay } from '@/lib/format';
import { PRESCRIPTION_CATEGORY_LABELS } from '@/lib/labels';
import { type MedicineItem, type MedicineVisit, useGetMedicinesQuery } from '@/redux/features/intake';
import { colors, icon, space } from '@/theme/tokens';

function groupItems(items: MedicineItem[]) {
  const groups = new Map<string, MedicineItem[]>();
  for (const item of items) {
    const key = PRESCRIPTION_CATEGORY_LABELS[item.category] ?? 'Other';
    groups.set(key, [...(groups.get(key) ?? []), item]);
  }
  return [...groups.entries()];
}

function VisitCard({ visit }: { visit: MedicineVisit }) {
  return (
    <Card>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`Prescription of ${formatDay(visit.date)}`}
        onPress={() => router.push(`/prescriptions/${visit.prescriptionId}`)}
        style={styles.head}
      >
        <View style={styles.flex}>
          <AppText weight="semibold">{formatDay(visit.date)}</AppText>
          <AppText variant="label" tone="muted">
            Prescription #{visit.prescriptionNo}
            {visit.doctor ? ` · ${visit.doctor}` : ''}
          </AppText>
        </View>
        <ChevronRight size={icon.md} color={colors.textMuted} />
      </Pressable>
      {groupItems(visit.items).map(([group, items]) => (
        <View key={group} style={styles.group}>
          <AppText variant="label" weight="semibold" tone="primary">
            {group}
          </AppText>
          {items.map((item) => (
            <View key={item.id} style={styles.item}>
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
        </View>
      ))}
    </Card>
  );
}

export default function MedicinesScreen() {
  const medicines = useGetMedicinesQuery();
  const { refreshing, onRefresh } = useRefresh(medicines.refetch);
  return (
    <ListScreen
      data={medicines.data}
      keyExtractor={(v) => v.prescriptionId}
      isLoading={medicines.isLoading}
      error={medicines.error}
      refreshing={refreshing}
      onRefresh={onRefresh}
      onRetry={medicines.refetch}
      header={
        medicines.data?.length ? (
          <AppText tone="muted" variant="label">
            Medicines and supplements from every visit, newest first. Tap a visit to see the full
            prescription.
          </AppText>
        ) : null
      }
      renderItem={({ item }) => <VisitCard visit={item} />}
      empty={
        <EmptyState
          icon={Pill}
          title="No medicines yet"
          message="Medicines and supplements your doctor prescribes will show here after each visit."
        />
      }
    />
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, minWidth: 0 },
  head: { flexDirection: 'row', alignItems: 'center', gap: space.sm },
  group: {
    gap: space.xs,
    paddingTop: space.sm,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
  },
  item: { gap: space.xxs, paddingVertical: space.xs },
  itemHead: { flexDirection: 'row', alignItems: 'center', gap: space.sm },
});
